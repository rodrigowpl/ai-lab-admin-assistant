import { DynamicModule, Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigModuleOptions as NestConfigModuleOptions,
} from '@nestjs/config';
import { ConfigService } from './config.service.js';

@Module({})
export class ConfigModule {
  static forRoot(options?: NestConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      global: true,
      imports: [
        NestConfigModule.forRoot({
          ...options,
          isGlobal: true,
          expandVariables: true,
        }),
      ],
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
