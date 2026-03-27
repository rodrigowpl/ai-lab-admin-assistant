import { type BaseMessage } from "@langchain/core/messages";
import { type ILlmService } from "../src/agent/services/llm.interface.ts";
import { type CalendarService } from "../src/calendar/calendar.service.ts";
import { Result } from "../src/lib/result.ts";
import { type CalendarEvent } from "../src/calendar/calendar.types.ts";

export function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "evt-1",
    summary: "Reunião de alinhamento",
    description: undefined,
    startDateTime: new Date("2026-04-01T10:00:00Z"),
    endDateTime: new Date("2026-04-01T11:00:00Z"),
    durationMinutes: 60,
    calendarId: "primary",
    calendarName: "Work",
    htmlLink: undefined,
    ...overrides,
  };
}

/** Builds a mock LLM service that returns canned structured responses. */
export function createMockLlm(
  responses: Record<string, unknown>,
): ILlmService {
  return {
    generateStructured: async <T>(_sys: string, user: string): Promise<T> => {
      for (const [key, value] of Object.entries(responses)) {
        if (user.toLowerCase().includes(key.toLowerCase())) {
          return value as T;
        }
      }
      return { message: "Ok." } as T;
    },
    getModel: () => ({}) as never,
  };
}

/** Builds a mock CalendarService with stubbed methods. */
export function createMockCalendar(
  stubs: Partial<{
    createEvent: CalendarService["createEvent"];
    listEvents: CalendarService["listEvents"];
    checkAvailability: CalendarService["checkAvailability"];
    deleteEvent: CalendarService["deleteEvent"];
    findEventsByQuery: CalendarService["findEventsByQuery"];
    updateEvent: CalendarService["updateEvent"];
    listCalendars: CalendarService["listCalendars"];
    findFreeSlots: CalendarService["findFreeSlots"];
  }> = {},
): CalendarService {
  const noop = async () => Result.ok(undefined as never);
  return {
    createEvent: stubs.createEvent ?? noop,
    listEvents: stubs.listEvents ?? (async () => Result.ok([])),
    checkAvailability: stubs.checkAvailability ?? (async () => Result.ok(true)),
    deleteEvent: stubs.deleteEvent ?? noop,
    findEventsByQuery:
      stubs.findEventsByQuery ?? (async () => Result.ok([])),
    updateEvent: stubs.updateEvent ?? noop,
    listCalendars: stubs.listCalendars ?? (async () => Result.ok([])),
    findFreeSlots: stubs.findFreeSlots ?? (async () => Result.ok([])),
  } as unknown as CalendarService;
}

export function threadConfig(id: string) {
  return { configurable: { thread_id: id } };
}

export function lastAiMessage(result: { messages: BaseMessage[] }): string {
  const msgs = result.messages;
  const content = msgs[msgs.length - 1].content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b): b is { type: "text"; text: string } => typeof b === "object" && b.type === "text")
      .map((b) => b.text)
      .join(" ");
  }
  return String(content);
}
