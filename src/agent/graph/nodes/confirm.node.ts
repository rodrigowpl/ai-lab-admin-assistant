import { type AgentState } from "../state.ts";
import { type CalendarService } from "../../../calendar/calendar.service.ts";
import { type ILlmService } from "../../services/llm.interface.ts";
import {
  ConfirmSchema,
  getSystemPrompt,
} from "../../prompts/confirm.prompt.ts";

export function createConfirmNode(
  calendarApi: CalendarService,
  llmService: ILlmService,
) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const messageContent = state.messages.at(-1)?.text;

    const confirmContext =
      state.pendingConfirmation === "delete"
        ? "Confirmação de deleção de evento"
        : "Confirmação de criação com conflito";

    const result = await llmService.generateStructured(
      getSystemPrompt(),
      `Mensagem do usuário: ${messageContent}\nContexto da confirmação: ${confirmContext}`,
      ConfirmSchema,
    );

    if (!result.confirmed) {
      return {
        pendingConfirmation: undefined,
        actionSuccess: false,
        actionError: "Operação cancelada pelo usuário",
      };
    }

    // Handle delete confirmation
    if (state.pendingConfirmation === "delete" && state.targetEventId) {
      const deleteResult = await calendarApi.deleteEvent(
        state.targetEventId,
        state.calendarId,
      );

      return {
        pendingConfirmation: undefined,
        actionSuccess: deleteResult.isSuccess(),
        actionError: deleteResult.isFailure()
          ? deleteResult.error.message
          : undefined,
      };
    }

    // Handle disambiguation selection
    if (
      result.selectedIndex != null &&
      state.matchedEvents &&
      state.matchedEvents[result.selectedIndex]
    ) {
      const selected = state.matchedEvents[result.selectedIndex];
      return {
        pendingConfirmation: undefined,
        targetEventId: selected.id,
        matchedEvents: [selected],
      };
    }

    return {
      pendingConfirmation: undefined,
      actionSuccess: true,
    };
  };
}
