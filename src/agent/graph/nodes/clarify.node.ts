import { type AgentState } from '../state.ts';
import { type ILlmService } from '../../services/llm.interface.ts';
import {
  MessageGeneratorSchema,
  getSystemPrompt,
} from '../../prompts/message-generator.prompt.ts';

export function createClarifyNode(llmService: ILlmService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    let scenario: string;
    let contextData: string;

    if (state.matchedEvents && state.matchedEvents.length > 1) {
      scenario = 'disambiguation';
      contextData = JSON.stringify(
        state.matchedEvents.map((e, i) => ({
          index: i + 1,
          summary: e.summary,
          date: e.startDateTime.toLocaleString('pt-BR'),
          calendar: e.calendarName,
        })),
      );
    } else if (state.actionError === 'missing_info') {
      scenario = 'missing_info';
      contextData = JSON.stringify({
        intent: state.intent,
        hasSummary: !!state.eventSummary,
        hasDateTime: !!state.eventDateTime,
        hasDuration: !!state.eventDuration,
      });
    } else {
      scenario = 'clarify';
      contextData = 'Não foi possível entender a solicitação.';
    }

    const result = await llmService.generateStructured(
      getSystemPrompt(),
      `Cenário: ${scenario}\nDados do contexto: ${contextData}\nGere a resposta apropriada em PT-BR.`,
      MessageGeneratorSchema,
    );

    return {
      actionError: result.message,
    };
  };
}
