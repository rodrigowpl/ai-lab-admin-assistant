import { type AgentState } from '../state.ts';
import { type ILlmService } from '../../services/llm.interface.ts';
import {
  IdentifyIntentSchema,
  getSystemPrompt,
} from '../../prompts/identify-intent.prompt.ts';
import { type BaseMessage } from '@langchain/core/messages';

function extractTextContent(message: BaseMessage): string {
  const content = message.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((block) => typeof block === 'object' && block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join(' ');
  }
  return '';
}

export function createIdentifyIntentNode(llmService: ILlmService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent = extractTextContent(lastMessage);

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
      // Intent & extracted data
      intent: result.intent,
      eventSummary: result.eventSummary ?? undefined,
      eventDateTime: result.eventDateTime
        ? new Date(result.eventDateTime)
        : undefined,
      eventDuration: result.eventDuration ?? undefined,
      calendarId: result.calendarId ?? undefined,
      queryDateRange:
        result.queryDateRangeStart && result.queryDateRangeEnd
          ? {
              start: new Date(result.queryDateRangeStart),
              end: new Date(result.queryDateRangeEnd),
            }
          : undefined,

      // Reset flow-control state from previous turns
      actionSuccess: undefined,
      actionError: undefined,
      actionResult: undefined,
      matchedEvents: undefined,
      pendingConfirmation: undefined,
      targetEventId: undefined,
    };
  };
}
