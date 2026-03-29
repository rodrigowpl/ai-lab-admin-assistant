# Code Conventions

## Naming Conventions

**Files:**
kebab-case with role suffix: `calendar.service.ts`, `google-calendar.repository.ts`, `create-event.node.ts`, `identify-intent.prompt.ts`

**Classes:**
PascalCase with role suffix: `CalendarService`, `GoogleCalendarRepository`, `GoogleAuthProvider`, `LlmService`, `BaseException`

**Functions/Methods:**
camelCase: `createEvent`, `resolveCalendarId`, `calendarEventFromGoogle`, `buildContextData`

**Node factory functions:**
`create<Name>Node(deps)` pattern: `createIdentifyIntentNode(llmService)`, `createCreateEventNode(calendarService)`

**Prompt functions:**
`getSystemPrompt()` and `getUserPromptTemplate()` per prompt file

**Types/Interfaces:**
PascalCase, `I` prefix for service interfaces: `ILlmService`, `CalendarEvent`, `CreateEventParams`, `AgentState`

**Constants:**
camelCase for config, UPPER_CASE for standalone constants: `config.llm.apiKey`, `TOKEN_PATH`, `REDIRECT_URI`, `SCOPES`

## Code Organization

**Import style:**
- Named imports with `.ts` extension: `import { Result } from '../lib/result.ts'`
- Type-only imports used: `import { type Config } from '../lib/config.ts'`
- External packages without extension: `import { z } from 'zod'`

**File structure:**
- Imports → exports/types → class/function definition
- One primary export per file (class or factory function)
- `index.ts` barrel files for re-exports in `nodes/` and `prompts/`

## Type Safety

**Approach:** Strict TypeScript (`strict: true` in tsconfig)
- Zod schemas for LLM output validation
- LangGraph `Annotation` for state typing
- `Result<T, E>` monad for error propagation (no thrown exceptions in business logic)
- Typed config via `as const` assertion

## Error Handling

**Pattern:** Result monad in service layer, typed exceptions
- `CalendarService` methods return `Result<T, BaseException>` — never throw
- `BaseException` hierarchy: `BadRequestException` (400), `NotFoundException` (404), `ConflictException` (409), `InternalServerException` (500)
- Graph nodes check `result.isFailure()` and set `actionError` in state
- Repository layer (`GoogleCalendarRepository`) lets errors propagate (caught by service)

## Language

**UI/Prompts:** Portuguese (PT-BR) — all system prompts, error messages, and user-facing strings
**Code:** English — variable names, comments, class names
**Dates:** Brazilian format in user-facing output (`toLocaleString('pt-BR')`)
