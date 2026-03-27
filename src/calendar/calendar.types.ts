import { calendar_v3 } from 'googleapis';

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface CalendarInfo {
  id: string;
  name: string;
  primary: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | undefined;
  startDateTime: Date;
  endDateTime: Date;
  durationMinutes: number;
  calendarId: string;
  calendarName: string;
  htmlLink: string | undefined;
}

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

export function calendarEventFromGoogle(
  event: calendar_v3.Schema$Event,
  calendarId: string,
  calendarName: string,
): CalendarEvent {
  const startDateTime = new Date(
    event.start?.dateTime ?? event.start?.date ?? '',
  );
  const endDateTime = new Date(event.end?.dateTime ?? event.end?.date ?? '');

  return {
    id: event.id ?? '',
    summary: event.summary ?? '',
    description: event.description ?? undefined,
    startDateTime,
    endDateTime,
    durationMinutes: (endDateTime.getTime() - startDateTime.getTime()) / 60000,
    calendarId,
    calendarName,
    htmlLink: event.htmlLink ?? undefined,
  };
}
