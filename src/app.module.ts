import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/module/config/index.js';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
