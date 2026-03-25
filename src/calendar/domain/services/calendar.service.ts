import { Injectable } from '@nestjs/common';
import { Result } from '../../../shared/lib/core/index.js';
import {
  NotFoundException,
  ConflictException,
  InternalServerException,
  type BaseException,
} from '../../../shared/lib/core/exception/index.js';
import { ConfigService } from '../../../shared/module/config/index.js';
import { GoogleCalendarRepository } from '../../infra/repositories/google-calendar.repository.js';
import {
  CalendarEvent,
  type TimeSlot,
  type CalendarInfo,
} from '../models/index.js';

export interface CreateEventParams {
  summary: string;
  description?: string;
  startDateTime: Date;
  durationMinutes?: number;
  calendarId?: string;
}

export interface UpdateEventParams {
  summary?: string;
  description?: string;
  startDateTime?: Date;
  durationMinutes?: number;
  calendarId?: string;
}

export interface ListEventsParams {
  startDate: Date;
  endDate: Date;
  calendarId?: string;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly calendarRepo: GoogleCalendarRepository,
    private readonly config: ConfigService,
  ) {}

  // T9: createEvent
  async createEvent(
    params: CreateEventParams,
  ): Promise<Result<CalendarEvent, BaseException>> {
    const calendarId =
      params.calendarId ?? this.config.googleCalendar.defaultCalendarId;
    const durationMinutes =
      params.durationMinutes ?? this.config.defaults.defaultDurationMinutes;

    const endDateTime = new Date(
      params.startDateTime.getTime() + durationMinutes * 60000,
    );

    // Check availability
    const isAvailable = await this.checkAvailability(
      params.startDateTime,
      durationMinutes,
      calendarId,
    );

    if (isAvailable.isSuccess() && !isAvailable.value) {
      const freeSlots = await this.findFreeSlots(
        params.startDateTime,
        durationMinutes,
        calendarId,
      );

      return Result.fail(
        new ConflictException('Já existe um evento para esse horário', [
          ...(freeSlots.isSuccess()
            ? freeSlots.value.map(
                (s) =>
                  `${s.start.toLocaleString('pt-BR')} - ${s.end.toLocaleString('pt-BR')}`,
              )
            : []),
        ]),
      );
    }

    try {
      const event = await this.calendarRepo.insert(calendarId, {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.startDateTime.toISOString(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
        },
      });

      const calendarName = await this.resolveCalendarName(calendarId);
      return Result.ok(
        CalendarEvent.createFromGoogle(event, calendarId, calendarName),
      );
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao criar evento', [String(error)]),
      );
    }
  }

  // T10: listEvents
  async listEvents(
    params: ListEventsParams,
  ): Promise<Result<CalendarEvent[], BaseException>> {
    const calendarId =
      params.calendarId ?? this.config.googleCalendar.defaultCalendarId;

    try {
      const events = await this.calendarRepo.list(calendarId, {
        timeMin: params.startDate.toISOString(),
        timeMax: params.endDate.toISOString(),
      });

      const calendarName = await this.resolveCalendarName(calendarId);
      return Result.ok(
        events.map((e) =>
          CalendarEvent.createFromGoogle(e, calendarId, calendarName),
        ),
      );
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao listar eventos', [String(error)]),
      );
    }
  }

  // T10: checkAvailability
  async checkAvailability(
    dateTime: Date,
    durationMinutes: number,
    calendarId?: string,
  ): Promise<Result<boolean, BaseException>> {
    const cId =
      calendarId ?? this.config.googleCalendar.defaultCalendarId;
    const endDateTime = new Date(
      dateTime.getTime() + durationMinutes * 60000,
    );

    try {
      const results = await this.calendarRepo.freeBusy({
        timeMin: dateTime.toISOString(),
        timeMax: endDateTime.toISOString(),
        calendarIds: [cId],
      });

      const busy = results.find((r) => r.calendarId === cId)?.busy ?? [];
      return Result.ok(busy.length === 0);
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao verificar disponibilidade', [
          String(error),
        ]),
      );
    }
  }

  // T10: findFreeSlots
  async findFreeSlots(
    referenceDate: Date,
    durationMinutes: number,
    calendarId?: string,
  ): Promise<Result<TimeSlot[], BaseException>> {
    const cId =
      calendarId ?? this.config.googleCalendar.defaultCalendarId;

    // Get start/end of the week containing referenceDate
    const weekStart = new Date(referenceDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(8, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 5); // Friday
    weekEnd.setHours(18, 0, 0, 0);

    try {
      const results = await this.calendarRepo.freeBusy({
        timeMin: weekStart.toISOString(),
        timeMax: weekEnd.toISOString(),
        calendarIds: [cId],
      });

      const busy = results.find((r) => r.calendarId === cId)?.busy ?? [];
      const busyPeriods = busy.map((b) => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }));

      const freeSlots: TimeSlot[] = [];

      // Check each day Mon-Fri, 8am-6pm, in 30min increments
      for (let day = 0; day < 5; day++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(dayStart.getDate() + day);

        for (let hour = 8; hour < 18; hour++) {
          for (const min of [0, 30]) {
            const slotStart = new Date(dayStart);
            slotStart.setHours(hour, min, 0, 0);
            const slotEnd = new Date(
              slotStart.getTime() + durationMinutes * 60000,
            );

            if (slotEnd > weekEnd) continue;
            if (slotStart < new Date()) continue; // skip past slots

            const isBusy = busyPeriods.some(
              (b) => slotStart < b.end && slotEnd > b.start,
            );

            if (!isBusy) {
              freeSlots.push({
                start: slotStart,
                end: slotEnd,
                durationMinutes,
              });
            }
          }
        }
      }

      return Result.ok(freeSlots.slice(0, 10)); // return top 10 suggestions
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao buscar horários livres', [
          String(error),
        ]),
      );
    }
  }

  // T11: deleteEvent
  async deleteEvent(
    eventId: string,
    calendarId?: string,
  ): Promise<Result<void, BaseException>> {
    const cId =
      calendarId ?? this.config.googleCalendar.defaultCalendarId;

    try {
      await this.calendarRepo.delete(cId, eventId);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao deletar evento', [String(error)]),
      );
    }
  }

  // T11: findEventsByQuery
  async findEventsByQuery(
    query: string,
    calendarId?: string,
  ): Promise<Result<CalendarEvent[], BaseException>> {
    const cId =
      calendarId ?? this.config.googleCalendar.defaultCalendarId;

    // Search within next 30 days
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60000);

    try {
      const events = await this.calendarRepo.list(cId, {
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
      });

      const calendarName = await this.resolveCalendarName(cId);
      const queryLower = query.toLowerCase();

      const matched = events
        .filter(
          (e) =>
            e.summary?.toLowerCase().includes(queryLower) ||
            e.description?.toLowerCase().includes(queryLower),
        )
        .map((e) => CalendarEvent.createFromGoogle(e, cId, calendarName));

      return Result.ok(matched);
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao buscar eventos', [String(error)]),
      );
    }
  }

  // T12: updateEvent
  async updateEvent(
    eventId: string,
    params: UpdateEventParams,
    calendarId?: string,
  ): Promise<Result<CalendarEvent, BaseException>> {
    const cId =
      calendarId ?? this.config.googleCalendar.defaultCalendarId;

    // If changing time, check for conflicts
    if (params.startDateTime) {
      const duration =
        params.durationMinutes ?? this.config.defaults.defaultDurationMinutes;
      const isAvailable = await this.checkAvailability(
        params.startDateTime,
        duration,
        cId,
      );

      if (isAvailable.isSuccess() && !isAvailable.value) {
        return Result.fail(
          new ConflictException(
            'Já existe um evento para esse horário',
            [],
          ),
        );
      }
    }

    const patchData: Record<string, unknown> = {};
    if (params.summary) patchData.summary = params.summary;
    if (params.description) patchData.description = params.description;
    if (params.startDateTime) {
      const duration =
        params.durationMinutes ?? this.config.defaults.defaultDurationMinutes;
      const endDateTime = new Date(
        params.startDateTime.getTime() + duration * 60000,
      );
      patchData.start = { dateTime: params.startDateTime.toISOString() };
      patchData.end = { dateTime: endDateTime.toISOString() };
    }

    try {
      const updated = await this.calendarRepo.patch(cId, eventId, patchData);
      const calendarName = await this.resolveCalendarName(cId);
      return Result.ok(
        CalendarEvent.createFromGoogle(updated, cId, calendarName),
      );
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao atualizar evento', [
          String(error),
        ]),
      );
    }
  }

  // T13: listCalendars
  async listCalendars(): Promise<Result<CalendarInfo[], BaseException>> {
    try {
      const calendars = await this.calendarRepo.calendarList();
      return Result.ok(
        calendars.map((c) => ({
          id: c.id ?? '',
          name: c.summary ?? '',
          primary: c.primary ?? false,
        })),
      );
    } catch (error) {
      return Result.fail(
        new InternalServerException('Erro ao listar calendários', [
          String(error),
        ]),
      );
    }
  }

  // Helper
  private async resolveCalendarName(calendarId: string): Promise<string> {
    try {
      const calendars = await this.calendarRepo.calendarList();
      const found = calendars.find((c) => c.id === calendarId);
      return found?.summary ?? calendarId;
    } catch {
      return calendarId;
    }
  }
}
