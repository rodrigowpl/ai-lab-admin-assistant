# Tech Stack

**Analyzed:** 2026-03-29

## Core

- Language: TypeScript 5.7+
- Runtime: Node.js >= 22 (ES2023 target, ESM modules)
- Package manager: Yarn (with `.yarnrc.yml`, nodeLinker default)
- Module system: ESM (`"type": "module"`, `allowImportingTsExtensions`)

## AI / Agent

- LLM orchestration: LangChain.js (`@langchain/core` ^1.1.36, `@langchain/openai` ^1.3.1, `@langchain/anthropic` ^1.3.25)
- Agent graph: LangGraph.js (`@langchain/langgraph` ^1.2.5) — state machine with checkpointing
- LLM gateway: OpenRouter (`gpt-4o-mini` default via `@langchain/openai` ChatOpenAI)
- Observability: LangSmith tracing (optional, configurable via env)

## Backend

- API style: No HTTP server in current code — agent runs via LangGraph dev server (`npx @langchain/langgraph-cli dev`)
- Schema validation: Zod ^4.3.6 (structured LLM output)
- Configuration: `dotenv` ^17.3.1 + typed config module

## External Services

- Calendar: Google Calendar API v3 via `googleapis` ^171.4.0
- Authentication: Google OAuth2 (offline refresh tokens stored in `.google-tokens.json`)

## Testing

- Unit/Integration: Node.js built-in test runner (`node:test`, `node:assert/strict`)
- E2E: Graph-level tests with mock LLM and mock CalendarService

## Development Tools

- TypeScript compiler: `tsc` (strict mode, `noEmit` — uses `--experimental-strip-types` at runtime)
- Linter: ESLint (configured but no `.eslintrc` found in root)
- LangGraph Studio: Dev server for interactive agent testing
