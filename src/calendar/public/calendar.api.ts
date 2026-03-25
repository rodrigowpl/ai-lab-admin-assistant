import { Injectable } from '@nestjs/common';
import { Result } from '../../shared/lib/core/index.js';
import { type BaseException } from '../../shared/lib/core/exception/index.js';
import {
  CalendarService,
  type CreateEventParams,
  type UpdateEventParams,
  type ListEventsParams,
} from '../domain/services/index.js';
import {
  type CalendarEvent,
  type TimeSlot,
  type CalendarInfo,
} from '../domain/models/index.js';

@Injectable()
export class CalendarApi {
  constructor(private readonly calendarService: CalendarService) {}

  async createEvent(
    params: CreateEventParams,
  ): Promise<Result<CalendarEvent, BaseException>> {
    return this.calendarService.createEvent(params);
  }

  async listEvents(
    params: ListEventsParams,
  ): Promise<Result<CalendarEvent[], BaseException>> {
    return this.calendarService.listEvents(params);
  }

  async deleteEvent(
    eventId: string,
    calendarId?: string,
  ): Promise<Result<void, BaseException>> {
    return this.calendarService.deleteEvent(eventId, calendarId);
  }

  async updateEvent(
    eventId: string,
    params: UpdateEventParams,
    calendarId?: string,
  ): Promise<Result<CalendarEvent, BaseException>> {
    return this.calendarService.updateEvent(eventId, params, calendarId);
  }

  async checkAvailability(
    dateTime: Date,
    durationMinutes: number,
    calendarId?: string,
  ): Promise<Result<boolean, BaseException>> {
    return this.calendarService.checkAvailability(
      dateTime,
      durationMinutes,
      calendarId,
    );
  }

  async findFreeSlots(
    referenceDate: Date,
    durationMinutes: number,
    calendarId?: string,
  ): Promise<Result<TimeSlot[], BaseException>> {
    return this.calendarService.findFreeSlots(
      referenceDate,
      durationMinutes,
      calendarId,
    );
  }

  async findEventsByQuery(
    query: string,
    calendarId?: string,
  ): Promise<Result<CalendarEvent[], BaseException>> {
    return this.calendarService.findEventsByQuery(query, calendarId);
  }

  async listCalendars(): Promise<Result<CalendarInfo[], BaseException>> {
    return this.calendarService.listCalendars();
  }
}
