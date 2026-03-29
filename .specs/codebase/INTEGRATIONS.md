# External Integrations

## Google Calendar API v3

**Service:** Google Calendar
**Purpose:** CRUD operations on calendar events, availability checking, free/busy queries
**Implementation:** `src/calendar/google-calendar.repository.ts`
**Configuration:** OAuth2 credentials via env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
**Authentication:** OAuth2 with offline refresh tokens stored in `.google-tokens.json`

### API Operations Used

| Operation | Method | Repository Method |
|---|---|---|
| Create event | `calendar.events.insert` | `insert()` |
| List events | `calendar.events.list` | `list()` |
| Update event | `calendar.events.patch` | `patch()` |
| Delete event | `calendar.events.delete` | `delete()` |
| Check availability | `calendar.freebusy.query` | `freeBusy()` |
| List calendars | `calendar.calendarList.list` | `calendarList()` |

### OAuth2 Setup

- One-time auth script: `yarn auth:google` (`scripts/google-auth.ts`)
- Starts local HTTP server on port 3100, opens browser for consent
- Saves tokens to `.google-tokens.json` (gitignored)
- Auto-refresh: `GoogleAuthProvider` listens for `tokens` event and persists updated tokens

## OpenRouter (LLM Gateway)

**Service:** OpenRouter API
**Purpose:** LLM inference for intent classification, message generation, confirmation parsing
**Implementation:** `src/agent/services/llm.service.ts` via `@langchain/openai` `ChatOpenAI`
**Configuration:** `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `NLP_MODEL`
**Authentication:** API key in `configuration.baseURL` override

### Usage Pattern

- `ChatOpenAI` with `temperature: 0` for deterministic outputs
- `withStructuredOutput(zodSchema, { method: "functionCalling" })` for typed responses
- Default model: `gpt-4o-mini` via OpenRouter

## LangSmith (Observability)

**Service:** LangSmith by LangChain
**Purpose:** Tracing and debugging agent runs
**Configuration:** `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `LANGSMITH_TRACING`, `LANGSMITH_ENDPOINT`
**Authentication:** API key via env var
**Notes:** Optional — tracing enabled/disabled via `LANGSMITH_TRACING` flag

## LangGraph Dev Server

**Service:** LangGraph CLI (`@langchain/langgraph-cli`)
**Purpose:** Interactive testing/debugging of the agent graph (LangGraph Studio)
**Configuration:** `langgraph.json` — points to `./src/agent/graph-entrypoint.ts:graph`
**Usage:** `yarn langgraph:serve` → `npx @langchain/langgraph-cli dev`
