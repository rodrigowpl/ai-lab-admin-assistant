import { Module } from '@nestjs/common';
import { GoogleAuthProvider } from './infra/providers/google-auth.provider.js';
import { GoogleCalendarRepository } from './infra/repositories/google-calendar.repository.js';
import { CalendarService } from './domain/services/calendar.service.js';
import { CalendarApi } from './public/calendar.api.js';

@Module({
  providers: [
    GoogleAuthProvider,
    GoogleCalendarRepository,
    CalendarService,
    CalendarApi,
  ],
  exports: [CalendarApi],
})
export class CalendarModule {}
