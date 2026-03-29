# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Node.js built-in test runner (`node:test`, `node:assert/strict`)
**E2E:** Graph-level tests using compiled LangGraph with mocked dependencies
**Coverage:** Not configured

## Test Organization

**Location:** `tests/` (root-level directory)
**Naming:** `*.test.ts` suffix — e.g., `agent.e2e.test.ts`
**Helpers:** `tests/mocks.ts` — shared mock factories and test utilities

## Testing Patterns

### E2E Graph Tests

**Approach:** Compile the full LangGraph with mock LLM and mock CalendarService, then invoke with `HumanMessage`
**Location:** `tests/agent.e2e.test.ts`

The tests use `createAgentGraph({ llmService, calendarService })` directly, bypassing the factory that wires real dependencies. This allows testing the full graph routing and node orchestration without hitting external APIs.

**Mock strategy:**
- `createMockLlm(responses)` — returns canned structured outputs based on keyword matching in the user prompt
- `createMockCalendar(stubs)` — partial stub of `CalendarService` methods, defaults to no-op results
- `makeEvent(overrides)` — factory for `CalendarEvent` test data
- `threadConfig(id)` — creates LangGraph thread config for stateful conversations
- `lastAiMessage(result)` — extracts the last AI message text from graph output

### Current Test Coverage

Only 1 test exists:
- `should create an event successfully` — happy path for event creation

## Test Execution

**Commands:**
```bash
# Run tests
yarn test
# → node --experimental-strip-types --env-file .env --test tests/**/*.test.ts

# Run tests in watch mode
yarn test:dev
# → node --experimental-strip-types --env-file .env --test --watch tests/**/*.test.ts
```

**Notes:**
- Uses `--experimental-strip-types` (Node.js native TS execution, no build step)
- Loads `.env` via `--env-file` flag
- No separate test env file (uses same `.env`)

## Coverage Targets

**Current:** Unknown — no coverage tool configured
**Goals:** Not documented
**Enforcement:** None
