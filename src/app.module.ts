import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/module/config/index.js';
import { PrismaModule } from './shared/module/prisma/index.js';
import { CalendarModule } from './calendar/calendar.module.js';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, CalendarModule],
})
export class AppModule {}
