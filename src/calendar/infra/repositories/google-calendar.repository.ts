import { Injectable } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthProvider } from '../providers/google-auth.provider.js';

export interface ListEventsParams {
  timeMin: string;
  timeMax: string;
  singleEvents?: boolean;
  orderBy?: string;
  maxResults?: number;
}

export interface FreeBusyParams {
  timeMin: string;
  timeMax: string;
  calendarIds: string[];
}

export interface FreeBusyResult {
  calendarId: string;
  busy: Array<{ start: string; end: string }>;
}

@Injectable()
export class GoogleCalendarRepository {
  private readonly calendar: calendar_v3.Calendar;

  constructor(private readonly authProvider: GoogleAuthProvider) {
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.authProvider.getAuthClient(),
    });
  }

  async insert(
    calendarId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return response.data;
  }

  async list(
    calendarId: string,
    params: ListEventsParams,
  ): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.calendar.events.list({
      calendarId,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      singleEvents: params.singleEvents ?? true,
      orderBy: params.orderBy ?? 'startTime',
      maxResults: params.maxResults ?? 100,
    });
    return response.data.items ?? [];
  }

  async patch(
    calendarId: string,
    eventId: string,
    event: Partial<calendar_v3.Schema$Event>,
  ): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.patch({
      calendarId,
      eventId,
      requestBody: event,
    });
    return response.data;
  }

  async delete(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    });
  }

  async freeBusy(params: FreeBusyParams): Promise<FreeBusyResult[]> {
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        items: params.calendarIds.map((id) => ({ id })),
      },
    });

    const calendars = response.data.calendars ?? {};
    return Object.entries(calendars).map(([calendarId, data]) => ({
      calendarId,
      busy: (data.busy ?? []).map((b) => ({
        start: b.start ?? '',
        end: b.end ?? '',
      })),
    }));
  }

  async calendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const response = await this.calendar.calendarList.list();
    return response.data.items ?? [];
  }
}
