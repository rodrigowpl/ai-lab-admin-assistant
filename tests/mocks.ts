import { type BaseMessage } from "@langchain/core/messages";
import { type ILlmService } from "../src/agent/services/llm.interface.ts";
import { type ISafeguardService, type SafeguardResult } from "../src/agent/services/safeguard.service.ts";
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

/** Builds a spy CalendarService that tracks method call counts. */
export function createSpyCalendar() {
  const calls = {
    createEvent: 0,
    listEvents: 0,
    checkAvailability: 0,
    deleteEvent: 0,
    findEventsByQuery: 0,
    updateEvent: 0,
    listCalendars: 0,
    findFreeSlots: 0,
  };

  const noop = async () => Result.ok(undefined as never);
  const service = {
    createEvent: async (...args: unknown[]) => { calls.createEvent++; return Result.ok(undefined as never); },
    listEvents: async (...args: unknown[]) => { calls.listEvents++; return Result.ok([]); },
    checkAvailability: async (...args: unknown[]) => { calls.checkAvailability++; return Result.ok(true); },
    deleteEvent: async (...args: unknown[]) => { calls.deleteEvent++; return Result.ok(undefined as never); },
    findEventsByQuery: async (...args: unknown[]) => { calls.findEventsByQuery++; return Result.ok([]); },
    updateEvent: async (...args: unknown[]) => { calls.updateEvent++; return Result.ok(undefined as never); },
    listCalendars: async (...args: unknown[]) => { calls.listCalendars++; return Result.ok([]); },
    findFreeSlots: async (...args: unknown[]) => { calls.findFreeSlots++; return Result.ok([]); },
  } as unknown as CalendarService;

  return { service, calls };
}

/** Builds a mock safeguard service that returns a canned result. */
export function createMockSafeguard(
  result: SafeguardResult = { safe: true },
): ISafeguardService {
  return { check: async () => result };
}

/** Builds a safeguard service that throws on every call (fail-secure testing). */
export function createFailingSafeguard(): ISafeguardService {
  return {
    check: async () => {
      throw new Error("Safeguard service unavailable");
    },
  };
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
