import 'dotenv/config';

function env(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${key}`);
}

export const config = {
  googleCalendar: {
    clientId: env('GOOGLE_CLIENT_ID'),
    clientSecret: env('GOOGLE_CLIENT_SECRET'),
    defaultCalendarId: env('GOOGLE_DEFAULT_CALENDAR_ID', 'primary'),
  },
  llm: {
    apiKey: env('OPENROUTER_API_KEY'),
    baseUrl: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    model: env('NLP_MODEL', 'gpt-4o-mini'),
  },
  langsmith: {
    apiKey: env('LANGSMITH_API_KEY', ''),
    project: env('LANGSMITH_PROJECT', 'ai-admin-assistant'),
    tracing: env('LANGSMITH_TRACING', 'false'),
  },
  safeguard: {
    model: env('SAFEGUARD_MODEL', 'openai/gpt-oss-safeguard-20b'),
    apiKey: env('SAFEGUARD_API_KEY', env('OPENROUTER_API_KEY')),
    baseUrl: env('SAFEGUARD_BASE_URL', env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')),
  },
  defaults: {
    defaultDurationMinutes: Number(env('DEFAULT_DURATION_MINUTES', '30')),
    defaultCalendar: env('DEFAULT_CALENDAR_NAME', 'Work'),
    userRole: env('DEFAULT_USER_ROLE', 'member') as 'admin' | 'member',
    language: 'pt-BR' as const,
  },
} as const;

export type Config = typeof config;
