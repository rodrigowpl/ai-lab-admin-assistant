import { Result } from '../lib/result.ts';
import {
  ConflictException,
  InternalServerException,
  type BaseException,
} from '../lib/base.exception.ts';
import { type Config } from '../lib/config.ts';
import { GoogleCalendarRepository } from './google-calendar.repository.ts';
import {
  calendarEventFromGoogle,
  type CalendarEvent,
  type TimeSlot,
  type CalendarInfo,
  type CreateEventParams,
  type UpdateEventParams,
  type ListEventsParams,
} from './calendar.types.ts';

export class CalendarService {
  private readonly calendarRepo: GoogleCalendarRepository;
  private readonly config: Config;

  constructor(calendarRepo: GoogleCalendarRepository, config: Config) {
    this.calendarRepo = calendarRepo;
    this.config = config;
  }

  // T9: createEvent
  async createEvent(
    params: CreateEventParams,
  ): Promise<Result<CalendarEvent, BaseException>> {
    const calendarId = await this.resolveCalendarId(params.calendarId);
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

      if (!event) {
        return Result.fail(
          new InternalServerException('Erro ao criar evento', [
            'Google Calendar retornou resposta vazia',
          ]),
        );
      }

      const calendarName = await this.resolveCalendarName(calendarId);
      return Result.ok(
        calendarEventFromGoogle(event, calendarId, calendarName),
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
    const calendarId = await this.resolveCalendarId(params.calendarId);

    try {
      const events = await this.calendarRepo.list(calendarId, {
        timeMin: params.startDate.toISOString(),
        timeMax: params.endDate.toISOString(),
      });

      const calendarName = await this.resolveCalendarName(calendarId);
      return Result.ok(
        events.map((e) =>
          calendarEventFromGoogle(e, calendarId, calendarName),
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
    const cId = await this.resolveCalendarId(calendarId);
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
    const cId = await this.resolveCalendarId(calendarId);

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
    const cId = await this.resolveCalendarId(calendarId);

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
    const cId = await this.resolveCalendarId(calendarId);

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
        .map((e) => calendarEventFromGoogle(e, cId, calendarName));

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
    const cId = await this.resolveCalendarId(calendarId);

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
        calendarEventFromGoogle(updated, cId, calendarName),
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

  // Helpers

  /**
   * Resolves a calendarId that may be a human-readable name (e.g. "Epanel")
   * into the actual Google Calendar ID (e.g. "xxx@group.calendar.google.com").
   * Falls back to defaultCalendarId if no match is found.
   */
  private async resolveCalendarId(
    calendarId: string | undefined,
  ): Promise<string> {
    const defaultId = this.config.googleCalendar.defaultCalendarId;
    if (!calendarId) return defaultId;

    // If it already looks like a valid Google Calendar ID (contains @ or is 'primary'), use it directly
    if (calendarId === 'primary' || calendarId.includes('@')) {
      return calendarId;
    }

    // Otherwise, try to match by name (case-insensitive)
    try {
      const calendars = await this.calendarRepo.calendarList();
      const nameLower = calendarId.toLowerCase();
      const found = calendars.find(
        (c) => c.summary?.toLowerCase().includes(nameLower),
      );
      return found?.id ?? defaultId;
    } catch {
      return defaultId;
    }
  }

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
