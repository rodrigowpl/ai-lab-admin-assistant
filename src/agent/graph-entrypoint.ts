/**
 * Entrypoint for LangGraph dev server (langgraph.json).
 * Creates the agent graph with dependencies configured from env vars.
 */
import { ChatOpenAI } from '@langchain/openai';
import { type ZodType } from 'zod';
import { createAgentGraph } from './domain/graph/graph.js';
import { type ILlmService } from './domain/services/llm.interface.js';
import { type CalendarApi } from '../calendar/public/calendar.api.js';
import { type CalendarEvent, type TimeSlot, type CalendarInfo } from '../calendar/domain/models/index.js';
import { Result } from '../shared/lib/core/index.js';
import { type BaseException, InternalServerException } from '../shared/lib/core/exception/index.js';

// Minimal LlmService for standalone graph (outside NestJS)
class StandaloneLlmService implements ILlmService {
  private readonly model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      modelName: process.env.NLP_MODEL ?? 'gpt-4o-mini',
      configuration: {
        baseURL:
          process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
      },
    });
  }

  async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const structuredModel = this.model.withStructuredOutput(schema);
    const result = await structuredModel.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return result as T;
  }

  getModel(): ChatOpenAI {
    return this.model;
  }
}

// Stub CalendarApi for sandbox testing (returns mock data)
class StubCalendarApi implements Partial<CalendarApi> {
  async createEvent(): Promise<Result<CalendarEvent, BaseException>> {
    return Result.fail(
      new InternalServerException(
        'CalendarApi não disponível no sandbox. Configure as credenciais Google para usar.',
      ),
    );
  }

  async listEvents(): Promise<Result<CalendarEvent[], BaseException>> {
    return Result.ok([]);
  }

  async deleteEvent(): Promise<Result<void, BaseException>> {
    return Result.fail(
      new InternalServerException('CalendarApi não disponível no sandbox.'),
    );
  }

  async updateEvent(): Promise<Result<CalendarEvent, BaseException>> {
    return Result.fail(
      new InternalServerException('CalendarApi não disponível no sandbox.'),
    );
  }

  async checkAvailability(): Promise<Result<boolean, BaseException>> {
    return Result.ok(true);
  }

  async findFreeSlots(): Promise<Result<TimeSlot[], BaseException>> {
    return Result.ok([]);
  }

  async findEventsByQuery(): Promise<Result<CalendarEvent[], BaseException>> {
    return Result.ok([]);
  }

  async listCalendars(): Promise<Result<CalendarInfo[], BaseException>> {
    return Result.ok([]);
  }
}

const llmService = new StandaloneLlmService();
const calendarApi = new StubCalendarApi() as unknown as CalendarApi;

export const graph = createAgentGraph({ llmService, calendarApi });
