# Architecture

**Pattern:** Modular monolith with LangGraph state machine at its core

## High-Level Structure

```
User message → LangGraph Agent Graph → Google Calendar API
                    ↓
              [identifyIntent] → route by intent
                    ↓
    ┌───────────────┼───────────────┐──────────────┐
    ↓               ↓               ↓              ↓
[createEvent]  [listEvents]   [deleteEvent]   [editEvent]
    ↓               ↓               ↓              ↓
    └───────────────┼───────────────┘──────────────┘
                    ↓
        ┌─── [clarify] (if missing info / disambiguation)
        │
        └─── [confirm] (if pending confirmation)
                    ↓
            [messageGenerator] → AI-generated PT-BR response
                    ↓
                   END
```

## Identified Patterns

### Result Monad

**Location:** `src/lib/result.ts`
**Purpose:** Explicit error handling without exceptions in business logic
**Implementation:** `Result<T, E>` with `ok()`, `fail()`, `match()`, `isSuccess()`, `isFailure()`
**Example:** `CalendarService.createEvent()` returns `Result<CalendarEvent, BaseException>`

### Factory Pattern for Dependency Injection

**Location:** `src/agent/graph/factory.ts`
**Purpose:** Wire real dependencies (auth, calendar, LLM) into the graph
**Implementation:** `buildGraph()` creates providers/repos/services and passes them to `createAgentGraph(deps)`
**Example:** Each graph node is a higher-order function: `createCreateEventNode(calendarService)` returns the node function

### Structured LLM Output

**Location:** `src/agent/services/llm.service.ts`, `src/agent/prompts/`
**Purpose:** Type-safe LLM responses using Zod schemas
**Implementation:** `ILlmService.generateStructured<T>(system, user, zodSchema)` → parsed `T`
**Example:** `IdentifyIntentSchema` returns intent + extracted entities; `ConfirmSchema` returns `{ confirmed, selectedIndex }`

### Repository Pattern

**Location:** `src/calendar/google-calendar.repository.ts`
**Purpose:** Isolate Google Calendar API calls behind a clean interface
**Implementation:** `GoogleCalendarRepository` wraps `googleapis` calendar v3 client
**Example:** `insert()`, `list()`, `patch()`, `delete()`, `freeBusy()`, `calendarList()`

### Service Layer

**Location:** `src/calendar/calendar.service.ts`
**Purpose:** Business logic over repository (availability checks, conflict detection, calendar resolution)
**Implementation:** `CalendarService` composes `GoogleCalendarRepository` + config
**Example:** `createEvent()` checks availability first, suggests free slots on conflict

## Data Flow

### Create Event Flow

1. User sends natural language message (PT-BR)
2. `identifyIntent` node → LLM extracts `intent: "create"`, `eventSummary`, `eventDateTime`, `eventDuration`
3. Router sends to `createEvent` node
4. `createEvent` validates required fields → calls `CalendarService.createEvent()`
5. Service checks availability via `freeBusy` API → inserts event or returns conflict with free slots
6. `messageGenerator` node → LLM generates user-facing PT-BR response
7. Response returned as `AIMessage`

### Confirmation Flow (Delete / Conflict)

1. Action node sets `pendingConfirmation` in state
2. On next user message, `routeFromStart` detects `pendingConfirmation` → routes to `confirm` node
3. `confirm` node → LLM determines if user confirmed or denied
4. If confirmed: executes action (e.g., delete event)
5. If denied: clears pending state, returns cancellation message

## Code Organization

**Approach:** Layer-based with domain separation (agent vs calendar vs lib)

**Module boundaries:**
- `src/agent/` depends on `src/calendar/` and `src/lib/`
- `src/calendar/` depends only on `src/lib/` and `googleapis`
- `src/lib/` has no internal dependencies (pure utilities)
