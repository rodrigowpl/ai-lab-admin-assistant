# Codebase Concerns

**Analysis Date:** 2026-03-29

## Tech Debt

**Minimal test coverage:**

- Issue: Only 1 E2E test (create event happy path). No tests for delete, edit, list, clarify, confirm flows. No unit tests for `CalendarService` or individual graph nodes.
- Files: `tests/agent.e2e.test.ts`
- Impact: Regressions in routing logic, error handling, or confirmation flows would go undetected. The mock infrastructure is already in place (`tests/mocks.ts`) but underutilized.
- Fix approach: Add E2E tests for each intent (list, delete, edit, check_availability, unknown). Add unit tests for `CalendarService` methods and individual node functions.

**README references NestJS but NestJS was removed:**

- Issue: README still mentions NestJS + Fastify and scripts like `yarn start:dev` / `yarn start` which don't exist in `package.json`. The project was refactored to a pure LangGraph agent without an HTTP framework.
- Files: `README.md`, `package.json`
- Impact: Developer onboarding confusion — documented scripts don't work.
- Fix approach: Update README to reflect current architecture (LangGraph dev server, no NestJS).

**Missing ESLint configuration:**

- Issue: `package.json` has a `lint` script referencing `eslint`, but no `.eslintrc`, `eslint.config.js`, or ESLint config file was found at the project root. The `eslint` package itself is not in `devDependencies`.
- Files: `package.json` (lint script)
- Impact: `yarn lint` likely fails. No code quality enforcement.
- Fix approach: Either add ESLint config + dependency or remove the lint scripts.

**Repeated `resolveCalendarName` / `resolveCalendarId` API calls:**

- Issue: `CalendarService` calls `calendarList()` API on every `resolveCalendarId()` and `resolveCalendarName()` invocation. A single `createEvent` call can hit `calendarList()` 2-3 times.
- Files: `src/calendar/calendar.service.ts` (lines 360-392)
- Impact: Unnecessary Google API calls, latency overhead, potential rate limiting.
- Fix approach: Cache calendar list with short TTL (e.g., 5 minutes) or resolve once per request.

## Security Considerations

**OAuth2 tokens stored as plaintext JSON:**

- Risk: `.google-tokens.json` contains refresh + access tokens in plain text on disk. Anyone with filesystem access can impersonate the user's Google Calendar.
- Files: `src/calendar/google-auth.provider.ts`, `scripts/google-auth.ts`
- Current mitigation: File is gitignored.
- Recommendations: Consider encrypted storage or OS keychain for production. Current approach is acceptable for local dev.

**No input sanitization on LLM outputs:**

- Risk: LLM-generated structured output (intent, eventSummary, etc.) is trusted and passed directly to Google Calendar API. A prompt injection could craft unexpected calendar operations.
- Files: `src/agent/graph/nodes/identify-intent.node.ts`, `src/calendar/calendar.service.ts`
- Current mitigation: Zod schema validation constrains output structure (enum for intents, typed fields).
- Recommendations: Add length limits on `eventSummary`, validate `eventDateTime` is a real future date. The Zod schemas provide structural validation but not semantic validation.

## Performance Bottlenecks

**Multiple sequential LLM calls per request:**

- Issue: A typical request makes 2 LLM calls: `identifyIntent` → action → `messageGenerator`. Clarify/confirm flows add a 3rd call. Each is a full OpenRouter round-trip.
- Files: `src/agent/graph/graph.ts`
- Impact: End-to-end latency is 2-3x a single LLM call (typically 2-6 seconds total).
- Fix approach: Acceptable for current use case. Could optimize by combining intent + response generation for simple queries.

**`findEventsByQuery` does client-side filtering:**

- Issue: `CalendarService.findEventsByQuery()` fetches all events for 30 days then filters by `summary`/`description` match in-memory. Google Calendar API supports server-side `q` parameter for text search.
- Files: `src/calendar/calendar.service.ts` (lines 242-275)
- Impact: Fetches more data than needed; scales poorly with many events.
- Fix approach: Use Google Calendar API's `q` query parameter in `events.list` for server-side filtering.

## Fragile Areas

**Confirmation flow relies on state persistence:**

- Issue: Delete and conflict confirmation flows depend on `pendingConfirmation` and `targetEventId` surviving across turns in `AgentState`. If state is lost or reset between turns, the confirmation breaks silently.
- Files: `src/agent/graph/graph.ts` (routing), `src/agent/graph/nodes/confirm.node.ts`
- Impact: Untested multi-turn flows could fail in production. The `identifyIntent` node resets `pendingConfirmation` to `undefined`, but `routeFromStart` checks it _before_ intent classification.
- Fix approach: Add E2E tests for multi-turn confirmation flows (both confirm and deny paths).

**`insert()` silently swallows errors:**

- Issue: `GoogleCalendarRepository.insert()` catches errors and returns `undefined` instead of throwing. The service then returns an `InternalServerException` with a generic message.
- Files: `src/calendar/google-calendar.repository.ts` (lines 39-48)
- Impact: Real API errors (auth expired, quota exceeded, invalid data) are logged to console but lost in the error chain. Other repo methods let errors propagate naturally.
- Fix approach: Remove the try/catch in `insert()` to match the pattern of other repository methods.
