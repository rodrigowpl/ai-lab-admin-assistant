import { type AgentState } from '../state.ts';
import { type ISafeguardService } from '../../services/safeguard.service.ts';
import { getSystemPrompt } from '../../prompts/identify-intent.prompt.ts';

export function createSafeguardCheckNode(safeguardService: ISafeguardService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    if (!state.guardrailsEnabled) {
      return {
        safeguardResult: { safe: true, reason: 'Guardrails disabled' },
      };
    }

    try {
      const userMessage = state.messages.at(-1)?.text ?? '';

      const currentDate = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Concatenate system prompt + user message so the safeguard sees
      // what instructions the attacker is trying to override
      const systemPrompt = getSystemPrompt(currentDate);
      const fullInput = `${systemPrompt}\n\nUser message: ${userMessage}`;

      const result = await safeguardService.check(fullInput);
      return { safeguardResult: result };
    } catch (error) {
      // Fail-secure: block on error
      console.error('Safeguard check failed:', error);
      return {
        safeguardResult: {
          safe: false,
          reason:
            'Safeguard service unavailable - request blocked for safety',
        },
      };
    }
  };
}
