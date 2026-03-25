# Google Calendar Assistant — Tasks

**Design**: `.specs/features/google-calendar-assistant/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Project Scaffolding (Sequential)

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Calendar Module (Sequential then Parallel)

```
T6 → T7 → T8
         ┌→ T9  ─┐
    T8 ──┼→ T10 ─┼──→ T14
         ├→ T11 ─┤
         ├→ T12 ─┤
         └→ T13 ─┘
```

### Phase 3: Agent Module — Foundation (Sequential)

```
T15 → T16 → T17
```

### Phase 4: Agent Nodes (Parallel)

```
          ┌→ T18 ─┐
          ├→ T19 ─┤
    T17 ──┼→ T20 ─┼──→ T25
          ├→ T21 ─┤
          ├→ T22 ─┤
          ├→ T23 ─┤
          └→ T24 ─┘
```

### Phase 5: Graph Assembly & Integration (Sequential)

```
T25 → T26 → T27 → T28
```

---

## Task Breakdown

---

### Phase 1: Project Scaffolding

---

### T1: Initialize NestJS project with Fastify

**What**: Criar projeto NestJS com Fastify adapter, TypeScript, ESM config
**Where**: `/ (root)`
**Depends on**: None
**Reuses**: Padrão de setup do caximbo/api (tsconfig, package.json)
**Requirement**: —

**Tools**:
- MCP: `context7` (NestJS + Fastify setup)
- Skill: NONE

**Done when**:
- [ ] `package.json` com NestJS, Fastify, TypeScript
- [ ] `tsconfig.json` com ES2022, NodeNext
- [ ] `src/main.ts` bootstrap com Fastify adapter
- [ ] `src/app.module.ts` vazio
- [ ] `yarn install` sem erros
- [ ] `yarn build` compila sem erros

**Verify**:
```bash
yarn build && node dist/main.js
# Expected: NestJS listening on port 3000
```

**Commit**: `feat(scaffold): initialize NestJS project with Fastify`

---

### T2: Configure Prisma with PostgreSQL

**What**: Instalar Prisma, configurar schema base, criar docker-compose para PostgreSQL
**Where**: `prisma/schema.prisma`, `docker-compose.yml`
**Depends on**: T1
**Reuses**: Padrão PrismaModule do caximbo/api
**Requirement**: —

**Tools**:
- MCP: `context7` (Prisma setup)
- Skill: NONE

**Done when**:
- [ ] `docker-compose.yml` com PostgreSQL 16
- [ ] `prisma/schema.prisma` com datasource e generator
- [ ] `yarn docker:up` inicia container
- [ ] `yarn prisma generate` sem erros
- [ ] `yarn prisma db push` aplica schema vazio

**Verify**:
```bash
yarn docker:up && yarn prisma db push
# Expected: PostgreSQL running, schema applied
```

**Commit**: `feat(scaffold): add Prisma with PostgreSQL docker-compose`

---

### T3: Create shared ConfigModule

**What**: Criar ConfigModule centralizado com variáveis de ambiente tipadas
**Where**: `src/shared/module/config/`
**Depends on**: T1
**Reuses**: Padrão ConfigModule do caximbo/api
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ConfigModule.forRoot()` com `@nestjs/config`
- [ ] `ConfigService` com propriedades tipadas: `googleCalendar`, `llm`, `langsmith`, `defaults`
- [ ] `.env.example` com todas as variáveis documentadas
- [ ] `.env` no `.gitignore`
- [ ] AppModule importa `ConfigModule.forRoot({ isGlobal: true })`

**Verify**:
```bash
yarn build
# Expected: compila sem erros, ConfigService injetável globalmente
```

**Commit**: `feat(config): create shared ConfigModule with typed env vars`

---

### T4: Create shared PrismaModule

**What**: Criar PrismaService e PrismaModule com lifecycle hooks
**Where**: `src/shared/module/prisma/`
**Depends on**: T2
**Reuses**: Padrão PrismaModule do caximbo/api
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `PrismaService` extends `PrismaClient` com `onModuleInit`/`onModuleDestroy`
- [ ] `PrismaModule` exporta `PrismaService`
- [ ] `PrismaRepository` base class com `handleAndThrowError()`
- [ ] AppModule importa PrismaModule

**Verify**:
```bash
yarn build && yarn docker:up
# Start app, verify DB connection log
```

**Commit**: `feat(prisma): create shared PrismaModule with base repository`

---

### T5: Create shared exception classes and Result type

**What**: Criar hierarquia de exceptions e Result/Either pattern
**Where**: `src/shared/lib/core/`
**Depends on**: T1
**Reuses**: Padrão Result + Exceptions do caximbo/api
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `Result<T, E>` com `ok()`, `fail()`, `isSuccess()`, `isFailure()`, `match()`
- [ ] `BaseException` com `status`, `name`, `message`, `details`
- [ ] Exceptions: `BadRequestException`, `NotFoundException`, `ConflictException`, `InternalServerException`
- [ ] Exports via barrel files

**Verify**:
```bash
yarn build
# Expected: tipos importáveis, sem erros
```

**Commit**: `feat(core): add Result/Either pattern and exception hierarchy`

---

### Phase 2: Calendar Module

---

### T6: Create GoogleAuthProvider

**What**: Criar provider que gerencia OAuth2 client do Google com token estático e auto-refresh
**Where**: `src/calendar/infra/providers/google-auth.provider.ts`
**Depends on**: T3
**Reuses**: —
**Requirement**: CAL-36

**Tools**:
- MCP: `context7` (googleapis OAuth2)
- Skill: NONE

**Done when**:
- [ ] `GoogleAuthProvider` injectable com `getAuthClient(): OAuth2Client`
- [ ] Lê `clientId`, `clientSecret`, `refreshToken` do ConfigService
- [ ] `refreshToken()` tenta refresh automático
- [ ] Exporta OAuth2Client configurado

**Verify**:
```bash
yarn build
# Expected: compila sem erros; teste manual com token real
```

**Commit**: `feat(calendar): add GoogleAuthProvider with OAuth2 static token`

---

### T7: Create GoogleCalendarRepository

**What**: Criar repository que faz chamadas diretas à Google Calendar API
**Where**: `src/calendar/infra/repositories/google-calendar.repository.ts`
**Depends on**: T6
**Reuses**: Padrão repository do caximbo/api
**Requirement**: —

**Tools**:
- MCP: `context7` (Google Calendar API)
- Skill: NONE

**Done when**:
- [ ] `insert(calendarId, event)` — cria evento
- [ ] `list(calendarId, params)` — lista eventos com `timeMin`/`timeMax`/`singleEvents`
- [ ] `patch(calendarId, eventId, event)` — atualiza evento parcialmente
- [ ] `delete(calendarId, eventId)` — deleta evento
- [ ] `freeBusy(params)` — consulta disponibilidade
- [ ] `calendarList()` — lista calendários da conta
- [ ] Error handling mapeado para exceptions do app

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): add GoogleCalendarRepository with CRUD operations`

---

### T8: Create CalendarEvent domain model and DTOs

**What**: Criar model de domínio CalendarEvent, TimeSlot, CalendarInfo e DTOs de entrada
**Where**: `src/calendar/domain/models/`, `src/calendar/presentation/dto/`
**Depends on**: T5
**Reuses**: Padrão BaseModel + DTOs com class-validator do caximbo/api
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `CalendarEvent` model com factory methods (`create`, `createFromGoogle`)
- [ ] `TimeSlot` value object
- [ ] `CalendarInfo` value object
- [ ] `CreateEventDto` com validação (summary, dateTime, duration?, calendarId?)
- [ ] `UpdateEventDto` com validação (campos opcionais)
- [ ] `ListEventsDto` com validação (dateRange)

**Verify**:
```bash
yarn build
# Expected: compila sem erros, tipos exportados
```

**Commit**: `feat(calendar): add domain models and DTOs`

---

### T9: Implement CalendarService.createEvent [P]

**What**: Implementar criação de evento com checagem de conflito e calendário default
**Where**: `src/calendar/domain/services/calendar.service.ts`
**Depends on**: T7, T8
**Reuses**: Result pattern
**Requirement**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `createEvent(params)` retorna `Result<CalendarEvent>`
- [ ] Usa calendário default ("Work") quando não informado
- [ ] Aplica duração padrão (30min) quando não informada
- [ ] Checa disponibilidade via `freeBusy` antes de criar
- [ ] Se conflito: retorna fail com horários livres via `findFreeSlots`
- [ ] Se sucesso: retorna evento criado com detalhes

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): implement createEvent with conflict detection`

---

### T10: Implement CalendarService.listEvents [P]

**What**: Implementar listagem de eventos por dia, semana e verificação de disponibilidade
**Where**: `src/calendar/domain/services/calendar.service.ts`
**Depends on**: T7, T8
**Reuses**: Result pattern
**Requirement**: CAL-08, CAL-09, CAL-10, CAL-11, CAL-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `listEvents(params)` retorna `Result<CalendarEvent[]>` com filtro por dateRange
- [ ] `checkAvailability(dateTime, duration, calendarId?)` retorna `Result<boolean>`
- [ ] `findFreeSlots(weekStart, duration, calendarId?)` retorna `Result<TimeSlot[]>`
- [ ] Retorna mensagem adequada quando sem eventos

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): implement listEvents and availability check`

---

### T11: Implement CalendarService.deleteEvent [P]

**What**: Implementar deleção de evento com busca por query
**Where**: `src/calendar/domain/services/calendar.service.ts`
**Depends on**: T7, T8
**Reuses**: Result pattern
**Requirement**: CAL-13, CAL-14, CAL-15, CAL-17

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `deleteEvent(eventId, calendarId?)` retorna `Result<void>`
- [ ] `findEventsByQuery(query, calendarId?)` retorna `Result<CalendarEvent[]>` (busca por summary/dateTime)
- [ ] Se não encontrado: `Result.fail(NotFoundException)`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): implement deleteEvent with query search`

---

### T12: Implement CalendarService.updateEvent [P]

**What**: Implementar edição de evento com patch parcial e checagem de conflito
**Where**: `src/calendar/domain/services/calendar.service.ts`
**Depends on**: T7, T8
**Reuses**: Result pattern
**Requirement**: CAL-19, CAL-20, CAL-22, CAL-23

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `updateEvent(eventId, params)` retorna `Result<CalendarEvent>`
- [ ] Suporta patch parcial (título, data, hora, duração, calendário)
- [ ] Checa conflito no novo horário se horário alterado
- [ ] Se não encontrado: `Result.fail(NotFoundException)`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): implement updateEvent with conflict check`

---

### T13: Implement CalendarService.listCalendars [P]

**What**: Implementar listagem de calendários disponíveis na conta Google
**Where**: `src/calendar/domain/services/calendar.service.ts`
**Depends on**: T7, T8
**Reuses**: Result pattern
**Requirement**: CAL-26, CAL-27

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `listCalendars()` retorna `Result<CalendarInfo[]>`
- [ ] Mapeia `CalendarListEntry` para `CalendarInfo`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(calendar): implement listCalendars`

---

### T14: Create CalendarModule and CalendarApi facade

**What**: Criar NestJS module e public API facade para o módulo Calendar
**Where**: `src/calendar/calendar.module.ts`, `src/calendar/public/calendar.api.ts`
**Depends on**: T9, T10, T11, T12, T13
**Reuses**: Padrão Public API facade do caximbo/api
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `CalendarModule` registra todos providers e exports `CalendarApi`
- [ ] `CalendarApi` expõe métodos do CalendarService para outros módulos
- [ ] AppModule importa CalendarModule

**Verify**:
```bash
yarn build
# Expected: compila sem erros, CalendarApi injetável
```

**Commit**: `feat(calendar): create CalendarModule with public API facade`

---

### Phase 3: Agent Module — Foundation

---

### T15: Create LlmService with OpenRouter

**What**: Criar service wrapper sobre ChatOpenAI para chamadas LLM com structured output
**Where**: `src/agent/domain/services/llm.service.ts`, `src/agent/infra/providers/openrouter.provider.ts`
**Depends on**: T3
**Reuses**: Padrão OpenRouterService do medical-appointment
**Requirement**: —

**Tools**:
- MCP: `context7` (LangChain ChatOpenAI)
- Skill: NONE

**Done when**:
- [ ] `LlmService` com `generateStructured<T>(systemPrompt, userPrompt, schema): Promise<T>`
- [ ] Usa `ChatOpenAI` com `baseURL` do OpenRouter e `model` do ConfigService
- [ ] Structured output via `.withStructuredOutput(zodSchema)`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create LlmService with OpenRouter structured output`

---

### T16: Define AgentState Annotation

**What**: Criar o tipo de estado do grafo com Annotation do LangGraph
**Where**: `src/agent/domain/graph/state.ts`
**Depends on**: T8 (usa CalendarEvent type)
**Reuses**: Padrão Annotation do LangGraph docs
**Requirement**: —

**Tools**:
- MCP: `context7` (LangGraph Annotation)
- Skill: NONE

**Done when**:
- [ ] `AgentStateAnnotation` com `Annotation.Root({...})`
- [ ] Campos: `messages`, `intent`, `eventSummary`, `eventDateTime`, `eventDuration`, `calendarId`, `targetEventId`, `queryDateRange`, `matchedEvents`, `pendingConfirmation`, `actionSuccess`, `actionError`, `actionResult`
- [ ] `messages` usa reducer `(x, y) => x.concat(y)`
- [ ] Type export: `AgentState = typeof AgentStateAnnotation.State`

**Verify**:
```bash
yarn build
# Expected: compila sem erros, tipos corretos
```

**Commit**: `feat(agent): define AgentState Annotation with typed fields`

---

### T17: Create prompt files for all nodes

**What**: Criar prompts externalizados com Zod schemas para cada nó do grafo
**Where**: `src/agent/domain/prompts/`
**Depends on**: T16
**Reuses**: Padrão de prompts do medical-appointment
**Requirement**: CAL-31, CAL-33, CAL-35

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `identify-intent.prompt.ts` — schema com intent enum, dados extraídos; system prompt com exemplos de cada intent
- [ ] `create-event.prompt.ts` — schema de confirmação
- [ ] `list-events.prompt.ts` — schema de formatação
- [ ] `delete-event.prompt.ts` — schema de busca
- [ ] `edit-event.prompt.ts` — schema de campos a editar
- [ ] `clarify.prompt.ts` — schema de mensagem de esclarecimento
- [ ] `message-generator.prompt.ts` — schema de resposta final em PT-BR
- [ ] Todos os prompts instruem LLM a responder em PT-BR

**Verify**:
```bash
yarn build
# Expected: compila sem erros, schemas validam corretamente
```

**Commit**: `feat(agent): create externalized prompts with Zod schemas`

---

### Phase 4: Agent Nodes

---

### T18: Create identifyIntentNode [P]

**What**: Nó que extrai intent e dados do evento da mensagem do usuário
**Where**: `src/agent/domain/graph/nodes/identify-intent.node.ts`
**Depends on**: T15, T17
**Reuses**: Padrão node factory do medical-appointment
**Requirement**: CAL-31, CAL-34, CAL-35

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createIdentifyIntentNode(llmService)`
- [ ] Extrai intent: `create | list | delete | edit | check_availability | unknown`
- [ ] Extrai dados: `eventSummary`, `eventDateTime`, `eventDuration`, `calendarId`, `queryDateRange`
- [ ] Usa structured output com Zod schema
- [ ] Retorna partial state update

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create identifyIntentNode with structured extraction`

---

### T19: Create createEventNode [P]

**What**: Nó que cria evento via CalendarApi e trata conflitos
**Where**: `src/agent/domain/graph/nodes/create-event.node.ts`
**Depends on**: T14, T16
**Reuses**: —
**Requirement**: CAL-01 a CAL-07, CAL-37

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createCreateEventNode(calendarApi)`
- [ ] Se faltam dados obrigatórios (título, data, hora): route para clarify pedindo info faltante
- [ ] Chama `calendarApi.createEvent()` com dados do estado
- [ ] Se conflito: seta `pendingConfirmation: 'create_conflict'` + `actionResult: freeSlots`
- [ ] Se sucesso: seta `actionSuccess: true` + `actionResult: event`
- [ ] Se erro: seta `actionError`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create createEventNode with conflict handling`

---

### T20: Create listEventsNode [P]

**What**: Nó que lista eventos e verifica disponibilidade
**Where**: `src/agent/domain/graph/nodes/list-events.node.ts`
**Depends on**: T14, T16
**Reuses**: —
**Requirement**: CAL-08 a CAL-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createListEventsNode(calendarApi)`
- [ ] Se intent `list`: chama `calendarApi.listEvents()` com dateRange
- [ ] Se intent `check_availability`: chama `calendarApi.checkAvailability()`
- [ ] Seta `actionResult` com lista ou status de disponibilidade

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create listEventsNode for queries and availability`

---

### T21: Create deleteEventNode [P]

**What**: Nó que busca evento para deleção e prepara confirmação
**Where**: `src/agent/domain/graph/nodes/delete-event.node.ts`
**Depends on**: T14, T16
**Reuses**: —
**Requirement**: CAL-13 a CAL-18

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createDeleteEventNode(calendarApi)`
- [ ] Busca evento por summary ou dateTime via `findEventsByQuery`
- [ ] Se 1 encontrado: seta `matchedEvents` + `pendingConfirmation: 'delete'`
- [ ] Se múltiplos: seta `matchedEvents` para desambiguação
- [ ] Se nenhum: seta `actionError: 'Evento não encontrado'`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create deleteEventNode with disambiguation`

---

### T22: Create editEventNode [P]

**What**: Nó que busca evento para edição e aplica alterações
**Where**: `src/agent/domain/graph/nodes/edit-event.node.ts`
**Depends on**: T14, T16
**Reuses**: —
**Requirement**: CAL-19 a CAL-23

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createEditEventNode(calendarApi)`
- [ ] Busca evento por summary via `findEventsByQuery`
- [ ] Se 1 encontrado: chama `calendarApi.updateEvent()` com novos campos
- [ ] Se múltiplos: seta `matchedEvents` para desambiguação
- [ ] Se conflito no novo horário: seta `pendingConfirmation`
- [ ] Se não encontrado: seta `actionError`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create editEventNode with update and disambiguation`

---

### T23: Create clarifyNode [P]

**What**: Nó que gera mensagem pedindo esclarecimento ao usuário
**Where**: `src/agent/domain/graph/nodes/clarify.node.ts`
**Depends on**: T15, T17
**Reuses**: —
**Requirement**: CAL-16, CAL-21, CAL-31

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createClarifyNode(llmService)`
- [ ] Se `matchedEvents` com múltiplos: gera lista formatada pedindo escolha
- [ ] Se intent `unknown`: gera mensagem pedindo reformulação
- [ ] Gera mensagem em PT-BR

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create clarifyNode for disambiguation and unknown intent`

---

### T24: Create confirmNode [P]

**What**: Nó que processa confirmação do usuário (sim/não) e executa ação pendente
**Where**: `src/agent/domain/graph/nodes/confirm.node.ts`
**Depends on**: T14, T15, T16
**Reuses**: —
**Requirement**: CAL-15, CAL-18

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createConfirmNode(calendarApi, llmService)`
- [ ] Analisa última mensagem para detectar confirmação (sim/não)
- [ ] Se confirmado + `pendingConfirmation === 'delete'`: executa `calendarApi.deleteEvent()`
- [ ] Se confirmado + `pendingConfirmation === 'create_conflict'`: cria evento mesmo assim ou seleciona alternativa
- [ ] Se negado: seta `actionSuccess: false` + mensagem de cancelamento
- [ ] Limpa `pendingConfirmation`

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create confirmNode for delete and conflict confirmation`

---

### T25: Create messageGeneratorNode

**What**: Nó final que gera resposta amigável em PT-BR baseada no resultado da ação
**Where**: `src/agent/domain/graph/nodes/message-generator.node.ts`
**Depends on**: T15, T17
**Reuses**: Padrão messageGeneratorNode do medical-appointment
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Factory function `createMessageGeneratorNode(llmService)`
- [ ] Gera resposta contextual baseada em: `intent`, `actionSuccess`, `actionError`, `actionResult`
- [ ] Cenários: create_success, create_conflict, list_results, list_empty, delete_confirm, delete_success, edit_success, error, clarify
- [ ] Appends `AIMessage` ao `messages`
- [ ] Sempre em PT-BR

**Verify**:
```bash
yarn build
# Expected: compila sem erros
```

**Commit**: `feat(agent): create messageGeneratorNode with PT-BR responses`

---

### Phase 5: Graph Assembly & Integration

---

### T26: Assemble StateGraph with nodes and edges

**What**: Montar o StateGraph completo com todos os nós, edges condicionais e routing
**Where**: `src/agent/domain/graph/graph.ts`
**Depends on**: T18 a T25
**Reuses**: Padrão StateGraph do medical-appointment + LangGraph docs
**Requirement**: —

**Tools**:
- MCP: `context7` (LangGraph conditional edges)
- Skill: NONE

**Done when**:
- [ ] `createAgentGraph(deps)` retorna grafo compilado
- [ ] Nós registrados: identifyIntent, createEvent, listEvents, deleteEvent, editEvent, clarify, confirm, messageGenerator
- [ ] `START → identifyIntent`
- [ ] Conditional edges após identifyIntent: create→createEvent, list/check→listEvents, delete→deleteEvent, edit→editEvent, unknown→clarify
- [ ] Conditional edges após action nodes: success→messageGenerator, conflict→confirm, multiple→clarify, not_found→messageGenerator
- [ ] `confirm → messageGenerator`
- [ ] `clarify → messageGenerator`
- [ ] `messageGenerator → END`
- [ ] MemorySaver como checkpointer (para multi-turn)

**Verify**:
```bash
yarn build
# Expected: compila sem erros, grafo compilável
```

**Commit**: `feat(agent): assemble StateGraph with full node routing`

---

### T27: Create AgentModule and wire NestJS dependencies

**What**: Criar NestJS module que instancia o grafo com todas as dependencies injetadas
**Where**: `src/agent/agent.module.ts`
**Depends on**: T14, T26
**Reuses**: —
**Requirement**: —

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `AgentModule` importa `CalendarModule`, `ConfigModule`
- [ ] Provider factory que cria graph instance injetando CalendarApi e LlmService
- [ ] AppModule importa AgentModule
- [ ] `yarn build` sem erros

**Verify**:
```bash
yarn build
# Expected: compila sem erros, app inicia
```

**Commit**: `feat(agent): create AgentModule with dependency wiring`

---

### T28: Configure LangGraph dev server and LangSmith tracing

**What**: Configurar `langgraph.json`, env vars do LangSmith, e script para `langgraph dev`
**Where**: `langgraph.json`, `.env`, `package.json` scripts
**Depends on**: T27
**Reuses**: —
**Requirement**: —

**Tools**:
- MCP: `context7` (LangGraph CLI, LangSmith config)
- Skill: NONE

**Done when**:
- [ ] `langgraph.json` apontando para o grafo compilado
- [ ] `.env` com `LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`
- [ ] `package.json` script: `"langgraph:dev": "npx @langchain/langgraph-cli dev"`
- [ ] Ao rodar `yarn langgraph:dev`, LangSmith Studio abre e mostra o grafo
- [ ] Enviar mensagem de teste pelo sandbox e ver trace no LangSmith

**Verify**:
```bash
yarn langgraph:dev
# Expected: dev server inicia, sandbox acessível no browser, traces aparecem no LangSmith
```

**Commit**: `feat(agent): configure LangGraph dev server and LangSmith tracing`

---

### T29: Add Prisma models for CalendarConfig and ConversationLog

**What**: Criar modelos Prisma e migration para configuração de calendários e logs
**Where**: `prisma/schema.prisma`
**Depends on**: T4
**Reuses**: —
**Requirement**: CAL-03, CAL-24

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Model `CalendarConfig` com `id`, `calendarId`, `calendarName`, `isDefault`, timestamps
- [ ] Model `ConversationLog` com `id`, `sessionId`, `userMessage`, `agentResponse`, `intent`, `success`, timestamps
- [ ] Seed com calendário default ("Work")
- [ ] `yarn prisma migrate dev` aplica sem erros

**Verify**:
```bash
yarn prisma migrate dev --name init
# Expected: migration criada e aplicada, tabelas existem
```

**Commit**: `feat(prisma): add CalendarConfig and ConversationLog models`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T4
  T1 → T3
  T1 → T5
  T2 → T29

Phase 2 (Sequential + Parallel):
  T6 → T7
  T5 + T7 → T8
  T8 complete, then:
    ├── T9  [P]
    ├── T10 [P]
    ├── T11 [P]  } Can run simultaneously
    ├── T12 [P]
    └── T13 [P]
  T9-T13 → T14

Phase 3 (Sequential):
  T3 → T15
  T8 → T16
  T16 → T17

Phase 4 (Parallel):
  T15 + T17 complete, then:
    ├── T18 [P]
    ├── T19 [P]
    ├── T20 [P]
    ├── T21 [P]  } Can run simultaneously
    ├── T22 [P]
    ├── T23 [P]
    └── T24 [P]
  T18-T24 → T25

Phase 5 (Sequential):
  T25 → T26 → T27 → T28
```

---

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1: Init NestJS | 1 scaffold | Granular |
| T2: Prisma + Docker | 1 config | Granular |
| T3: ConfigModule | 1 module | Granular |
| T4: PrismaModule | 1 module | Granular |
| T5: Exceptions + Result | 1 lib | Granular |
| T6: GoogleAuthProvider | 1 provider | Granular |
| T7: GoogleCalendarRepository | 1 repository | Granular |
| T8: Models + DTOs | 1 domain layer | Granular |
| T9-T13: Service methods | 1 method each | Granular |
| T14: CalendarModule | 1 module | Granular |
| T15: LlmService | 1 service | Granular |
| T16: AgentState | 1 type file | Granular |
| T17: All prompts | 7 files | OK (cohesive, all prompts) |
| T18-T25: Graph nodes | 1 node each | Granular |
| T26: Graph assembly | 1 file | Granular |
| T27: AgentModule | 1 module | Granular |
| T28: LangGraph dev + LangSmith | 1 integration | Granular |
| T29: Prisma models | 1 migration | Granular |
