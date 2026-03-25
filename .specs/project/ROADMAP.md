# Roadmap

## v1 — Google Calendar Assistant

**Objetivo:** Agente conversacional que gerencia eventos do Google Calendar via linguagem natural.

### Features

| # | Feature | Prioridade | Status |
|---|---------|-----------|--------|
| 1 | google-calendar-assistant | P1 (MVP) | Pending |

### Milestones

1. **Scaffolding & Infra** — NestJS + Prisma + Docker (PostgreSQL) + Google Calendar API auth
2. **Agent Core** — LangGraph StateGraph com intent detection e routing
3. **Calendar CRUD** — Criar, ler, editar, deletar eventos
4. **Smart Features** — Conflitos, sugestões de horário, desambiguação
5. **Observability** — LangSmith integrado + sandbox funcional

---

## v2 — Multi-account & Expansão (futuro)

- Suporte a múltiplas contas Google
- Autenticação dinâmica de usuários
- Interface web/frontend
- Novas responsabilidades administrativas
