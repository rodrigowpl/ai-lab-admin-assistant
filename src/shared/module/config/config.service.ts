import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfig: NestConfigService) {}

  get googleCalendar() {
    return {
      clientId: this.nestConfig.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.nestConfig.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      refreshToken: this.nestConfig.getOrThrow<string>('GOOGLE_REFRESH_TOKEN'),
      defaultCalendarId: this.nestConfig.get<string>(
        'GOOGLE_DEFAULT_CALENDAR_ID',
        'primary',
      ),
    };
  }

  get llm() {
    return {
      apiKey: this.nestConfig.getOrThrow<string>('OPENROUTER_API_KEY'),
      baseUrl: this.nestConfig.get<string>(
        'OPENROUTER_BASE_URL',
        'https://openrouter.ai/api/v1',
      ),
      model: this.nestConfig.get<string>('NLP_MODEL', 'gpt-4o-mini'),
    };
  }

  get langsmith() {
    return {
      apiKey: this.nestConfig.get<string>('LANGSMITH_API_KEY', ''),
      project: this.nestConfig.get<string>(
        'LANGSMITH_PROJECT',
        'ai-admin-assistant',
      ),
      tracing: this.nestConfig.get<string>('LANGSMITH_TRACING', 'false'),
    };
  }

  get defaults() {
    return {
      defaultDurationMinutes: Number(
        this.nestConfig.get<string>('DEFAULT_DURATION_MINUTES', '30'),
      ),
      defaultCalendar: this.nestConfig.get<string>(
        'DEFAULT_CALENDAR_NAME',
        'Work',
      ),
      language: 'pt-BR' as const,
    };
  }

  get database() {
    return {
      url: this.nestConfig.getOrThrow<string>('DATABASE_URL'),
    };
  }
}
