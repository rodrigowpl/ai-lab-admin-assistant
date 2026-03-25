# AI Admin Assistant

**Vision:** Agente conversacional em linguagem natural que atua como assistente administrativo pessoal, começando pela gestão de agenda via Google Calendar.
**For:** Uso pessoal do autor — organização de vida pessoal e empresa.
**Solves:** Eliminar fricção de gerenciar eventos manualmente no Google Calendar; permitir criação, edição, leitura e exclusão de eventos via chat em linguagem natural.

## Goals

- Gerenciar eventos do Google Calendar (CRUD) via prompts em linguagem natural em PT-BR
- Suportar múltiplos calendários com calendário default ("Work")
- Validar conflitos de horário e sugerir alternativas
- Arquitetura extensível para futuras responsabilidades administrativas (v2+)

## Tech Stack

**Core:**

- Framework: NestJS (Fastify)
- Language: TypeScript (ES2022+, ESM)
- Database: PostgreSQL + Prisma ORM
- Agent: LangGraph (StateGraph) + LangChain.js
- LLM: via OpenRouter (modelo configurável)

**Key dependencies:**

- `@langchain/langgraph` — orquestração do agente
- `@langchain/openai` — integração LLM via OpenRouter
- `googleapis` — Google Calendar API
- `prisma` — ORM
- `langsmith` — observabilidade e sandbox de teste

**Patterns:**

- Arquitetura 3 camadas por módulo: presentation / domain / infra com injeção de dependência
- Result/Either pattern para error handling em services
- Public API facade por módulo para comunicação inter-módulos
- Repositórios estendem base class com error handling
- StateGraph com estado tipado via Zod
- Routing condicional por intent
- Prompts externalizados por nó
- Structured output com Zod schemas

## Scope

**v1 includes:**

- CRUD de eventos no Google Calendar via linguagem natural
- Suporte a múltiplos calendários (uma conta Google)
- Detecção de conflitos e sugestão de horários livres
- Confirmação antes de deletar eventos
- Desambiguação quando múltiplos eventos correspondem ao prompt
- LangSmith configurado para observabilidade e sandbox de teste

**Explicitly out of scope:**

- Múltiplas contas Google (v2)
- Interface web/frontend (futuro)
- Autenticação dinâmica de usuários (v1 usa config estática)
- Outras responsabilidades administrativas além de agenda
- Notificações/lembretes
- Recorrência de eventos (criar série)

## Constraints

- Technical: Google Calendar API requer OAuth2 — na v1, token configurado estaticamente por aplicação
- Technical: LangSmith dev server como interface de teste do agente (sem UI própria)
- Idioma: Agente sempre responde em PT-BR
