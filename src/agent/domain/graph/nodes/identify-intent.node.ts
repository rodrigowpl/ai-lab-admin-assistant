import { type AgentState } from '../state.js';
import { type ILlmService } from '../../services/llm.interface.js';
import {
  IdentifyIntentSchema,
  getSystemPrompt,
} from '../../prompts/identify-intent.prompt.js';
import { HumanMessage } from '@langchain/core/messages';

export function createIdentifyIntentNode(llmService: ILlmService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent =
      lastMessage instanceof HumanMessage
        ? String(lastMessage.content)
        : '';

    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const result = await llmService.generateStructured(
      getSystemPrompt(currentDate),
      `Mensagem do usuário: ${messageContent}`,
      IdentifyIntentSchema,
    );

    return {
      intent: result.intent,
      eventSummary: result.eventSummary,
      eventDateTime: result.eventDateTime
        ? new Date(result.eventDateTime)
        : undefined,
      eventDuration: result.eventDuration,
      calendarId: result.calendarId,
      queryDateRange:
        result.queryDateRangeStart && result.queryDateRangeEnd
          ? {
              start: new Date(result.queryDateRangeStart),
              end: new Date(result.queryDateRangeEnd),
            }
          : undefined,
    };
  };
}
