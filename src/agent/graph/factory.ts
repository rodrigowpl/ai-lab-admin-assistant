import { config } from "../../lib/config.ts";
import { GoogleAuthProvider } from "../../calendar/google-auth.provider.ts";
import { GoogleCalendarRepository } from "../../calendar/google-calendar.repository.ts";
import { CalendarService } from "../../calendar/calendar.service.ts";
import { LlmService } from "../services/llm.service.ts";
import { createAgentGraph } from "./graph.ts";

export async function buildGraph() {
  const authProvider = new GoogleAuthProvider(config);
  const calendarRepo = new GoogleCalendarRepository(authProvider);
  const calendarService = new CalendarService(calendarRepo, config);
  const llmService = new LlmService(config);

  return createAgentGraph({ llmService, calendarService });
}
