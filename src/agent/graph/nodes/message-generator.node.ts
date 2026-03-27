import { AIMessage } from '@langchain/core/messages';
import { type AgentState } from '../state.ts';
import { type ILlmService } from '../../services/llm.interface.ts';
import {
  MessageGeneratorSchema,
  getSystemPrompt,
} from '../../prompts/message-generator.prompt.ts';
import { type CalendarEvent } from '../../../calendar/calendar.types.ts';

export function createMessageGeneratorNode(llmService: ILlmService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const scenario = determineScenario(state);
    const contextData = buildContextData(state);

    const result = await llmService.generateStructured(
      getSystemPrompt(),
      `Cenário: ${scenario}\nDados do contexto: ${contextData}\nGere a resposta apropriada em PT-BR.`,
      MessageGeneratorSchema,
    );

    return {
      messages: [new AIMessage(result.message)],
    };
  };
}

function determineScenario(state: AgentState): string {
  if (state.actionError === 'missing_info') return 'missing_info';
  if (state.actionError === 'multiple_events') return 'disambiguation';
  if (state.actionError === 'Operação cancelada pelo usuário')
    return 'delete_cancelled';

  if (state.intent === 'create') {
    if (state.pendingConfirmation === 'create_conflict')
      return 'create_conflict';
    return state.actionSuccess ? 'create_success' : 'error';
  }

  if (state.intent === 'list' || state.intent === 'check_availability') {
    const events = state.actionResult;
    if (Array.isArray(events) && events.length === 0) return 'list_empty';
    return state.actionSuccess ? 'list_results' : 'error';
  }

  if (state.intent === 'delete') {
    if (state.pendingConfirmation === 'delete') return 'delete_confirm';
    return state.actionSuccess ? 'delete_success' : 'error';
  }

  if (state.intent === 'edit') {
    return state.actionSuccess ? 'edit_success' : 'error';
  }

  return state.actionError ? 'error' : 'clarify';
}

function buildContextData(state: AgentState): string {
  const data: Record<string, unknown> = {
    intent: state.intent,
    success: state.actionSuccess,
    error: state.actionError,
  };

  if (state.actionResult) {
    if (Array.isArray(state.actionResult)) {
      data.events = state.actionResult.map((item) => {
        if ('summary' in item) {
          const event = item as CalendarEvent;
          return {
            summary: event.summary,
            start: event.startDateTime.toLocaleString('pt-BR'),
            end: event.endDateTime.toLocaleString('pt-BR'),
            duration: event.durationMinutes,
            calendar: event.calendarName,
          };
        }
        return item;
      });
    } else if ('summary' in state.actionResult) {
      const event = state.actionResult as CalendarEvent;
      data.event = {
        summary: event.summary,
        start: event.startDateTime.toLocaleString('pt-BR'),
        end: event.endDateTime.toLocaleString('pt-BR'),
        duration: event.durationMinutes,
        calendar: event.calendarName,
      };
    }
  }

  if (state.matchedEvents) {
    data.matchedEvents = state.matchedEvents.map((e, i) => ({
      index: i + 1,
      summary: e.summary,
      start: e.startDateTime.toLocaleString('pt-BR'),
      calendar: e.calendarName,
    }));
  }

  return JSON.stringify(data);
}
