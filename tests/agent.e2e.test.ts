import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HumanMessage } from "@langchain/core/messages";
import { createAgentGraph } from "../src/agent/graph/graph.ts";
import { Result } from "../src/lib/result.ts";
import {
  makeEvent,
  createMockLlm,
  createMockCalendar,
  threadConfig,
  lastAiMessage,
} from "./mocks.ts";

describe("AI Admin Assistant - E2E", () => {
  it("should create an event successfully", async () => {
    const event = makeEvent();

    const llm = createMockLlm({
      "Mensagem do usuário": {
        intent: "create",
        eventSummary: "Reunião de alinhamento",
        eventDateTime: "2026-04-01T10:00:00Z",
        eventDuration: 60,
        calendarId: null,
        queryDateRangeStart: null,
        queryDateRangeEnd: null,
      },
      Cenário: {
        message:
          "Evento 'Reunião de alinhamento' criado com sucesso para 01/04/2026 às 10:00.",
      },
    });

    const calendar = createMockCalendar({
      createEvent: async () => Result.ok(event),
    });

    const graph = createAgentGraph({
      llmService: llm,
      calendarService: calendar,
    });
    const result = await graph.invoke(
      {
        messages: [
          new HumanMessage("Crie uma reunião de alinhamento amanhã às 10h"),
        ],
      },
      threadConfig("create-happy"),
    );

    const reply = lastAiMessage(result);
    assert.ok(reply.length > 0, "should produce a non-empty response");
    assert.ok(reply.includes("Reunião"), "response should mention the event");
  });
});
