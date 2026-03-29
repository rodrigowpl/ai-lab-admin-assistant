# Project Structure

**Root:** `/ai-admin-assistant`

## Directory Tree

```
.
├── src/
│   ├── agent/
│   │   ├── graph/
│   │   │   ├── nodes/          # 8 graph nodes (one per intent + flow control)
│   │   │   ├── graph.ts        # StateGraph definition, routing logic
│   │   │   ├── state.ts        # AgentState annotation (LangGraph state schema)
│   │   │   └── factory.ts      # Wires real dependencies, builds compiled graph
│   │   ├── prompts/            # System prompts + Zod schemas for structured output
│   │   │   ├── identify-intent.prompt.ts
│   │   │   ├── message-generator.prompt.ts
│   │   │   ├── confirm.prompt.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── llm.interface.ts  # ILlmService interface
│   │   │   └── llm.service.ts    # ChatOpenAI via OpenRouter
│   │   └── graph-entrypoint.ts   # LangGraph CLI entry (exports `graph`)
│   ├── calendar/
│   │   ├── calendar.types.ts           # Domain types + Google→domain mapper
│   │   ├── calendar.service.ts         # Business logic (CRUD, availability, free slots)
│   │   ├── google-calendar.repository.ts  # Google Calendar API wrapper
│   │   └── google-auth.provider.ts     # OAuth2 token management
│   └── lib/
│       ├── result.ts           # Result<T,E> monad (ok/fail/match)
│       ├── base.exception.ts   # Typed exception hierarchy
│       └── config.ts           # Typed env config
├── tests/
│   ├── mocks.ts                # Test helpers (mock LLM, mock Calendar, utilities)
│   └── agent.e2e.test.ts       # E2E test: create event happy path
├── scripts/
│   └── google-auth.ts          # One-time OAuth2 token setup CLI
├── dist/                       # Compiled JS output
├── package.json
├── tsconfig.json
├── langgraph.json              # LangGraph dev server config
├── .env.example
└── .gitignore
```

## Module Organization

### Agent (`src/agent/`)

**Purpose:** AI agent that processes natural language into calendar actions
**Key files:** `graph-entrypoint.ts` (LangGraph CLI entry), `graph/graph.ts` (state machine definition)

### Calendar (`src/calendar/`)

**Purpose:** Google Calendar integration — domain types, business logic, API client
**Key files:** `calendar.service.ts` (business logic), `google-calendar.repository.ts` (API wrapper)

### Lib (`src/lib/`)

**Purpose:** Shared infrastructure — Result type, exceptions, config
**Key files:** `result.ts`, `config.ts`

## Where Things Live

**Agent graph definition:** `src/agent/graph/graph.ts`
**LLM prompts:** `src/agent/prompts/`
**Calendar business logic:** `src/calendar/calendar.service.ts`
**Google API calls:** `src/calendar/google-calendar.repository.ts`
**Configuration:** `src/lib/config.ts` + `.env`
**Tests:** `tests/`
