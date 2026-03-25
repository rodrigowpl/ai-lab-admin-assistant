import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/module/config/index.js';
import { PrismaModule } from './shared/module/prisma/index.js';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule],
})
export class AppModule {}
