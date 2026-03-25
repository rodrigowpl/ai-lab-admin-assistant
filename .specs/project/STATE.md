# State

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | PostgreSQL como banco de dados
| 2026-03-24 | LangSmith dev server como UI de teste | Sem frontend próprio na v1 |
| 2026-03-24 | Auth estática (nível de aplicação) | Simplificar v1; auth dinâmica na v2 |
| 2026-03-24 | Agente responde sempre em PT-BR | Preferência do usuário |
| 2026-03-24 | Arquitetura baseada em caximbo/api + medical-appointment | Reuso de padrões conhecidos pelo autor |

## Blockers

_Nenhum no momento._

## Lessons Learned

- Prisma 6 + Yarn PnP não funcionam bem juntos (generate falha). Solução: usar `nodeLinker: node-modules` no `.yarnrc.yml`
- Prisma 7 muda radicalmente a config (remove `url` do schema, exige `prisma.config.ts`). Mantivemos Prisma 6 por estabilidade

## Deferred Ideas

- Múltiplas contas Google (v2)
- Frontend web (futuro)
- Notificações/lembretes
- Eventos recorrentes (séries)

## Preferences

_Nenhuma registrada ainda._
