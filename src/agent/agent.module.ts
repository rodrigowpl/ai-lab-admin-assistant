import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module.js';
import { LlmService } from './domain/services/llm.service.js';
import { CalendarApi } from '../calendar/public/calendar.api.js';
import { createAgentGraph } from './domain/graph/graph.js';

export const AGENT_GRAPH = 'AGENT_GRAPH';

@Module({
  imports: [CalendarModule],
  providers: [
    LlmService,
    {
      provide: AGENT_GRAPH,
      useFactory: (llmService: LlmService, calendarApi: CalendarApi) => {
        return createAgentGraph({ llmService, calendarApi });
      },
      inject: [LlmService, CalendarApi],
    },
  ],
  exports: [AGENT_GRAPH],
})
export class AgentModule {}
