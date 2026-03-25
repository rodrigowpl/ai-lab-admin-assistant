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

export class CalendarEvent {
  readonly id: string;
  readonly summary: string;
  readonly description: string | undefined;
  readonly startDateTime: Date;
  readonly endDateTime: Date;
  readonly durationMinutes: number;
  readonly calendarId: string;
  readonly calendarName: string;
  readonly htmlLink: string | undefined;

  private constructor(data: {
    id: string;
    summary: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    calendarId: string;
    calendarName: string;
    htmlLink?: string;
  }) {
    this.id = data.id;
    this.summary = data.summary;
    this.description = data.description;
    this.startDateTime = data.startDateTime;
    this.endDateTime = data.endDateTime;
    this.durationMinutes =
      (data.endDateTime.getTime() - data.startDateTime.getTime()) / 60000;
    this.calendarId = data.calendarId;
    this.calendarName = data.calendarName;
    this.htmlLink = data.htmlLink;
  }

  static createFromGoogle(
    event: calendar_v3.Schema$Event,
    calendarId: string,
    calendarName: string,
  ): CalendarEvent {
    return new CalendarEvent({
      id: event.id ?? '',
      summary: event.summary ?? '',
      description: event.description ?? undefined,
      startDateTime: new Date(
        event.start?.dateTime ?? event.start?.date ?? '',
      ),
      endDateTime: new Date(event.end?.dateTime ?? event.end?.date ?? ''),
      calendarId,
      calendarName,
      htmlLink: event.htmlLink ?? undefined,
    });
  }

  static create(data: {
    id: string;
    summary: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    calendarId: string;
    calendarName: string;
    htmlLink?: string;
  }): CalendarEvent {
    return new CalendarEvent(data);
  }
}
