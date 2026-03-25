# Google Calendar Assistant — Specification

## Problem Statement

Gerenciar eventos no Google Calendar manualmente é tedioso — requer abrir a interface, navegar por calendários, preencher formulários. O objetivo é permitir CRUD de eventos via chat em linguagem natural (PT-BR), com validações inteligentes como detecção de conflitos e sugestão de horários alternativos.

## Goals

- [ ] Criar, ler, editar e deletar eventos no Google Calendar via prompts em linguagem natural
- [ ] Suportar múltiplos calendários com default configurável ("Work")
- [ ] Detectar conflitos de horário e sugerir alternativas
- [ ] Testar o agente via LangSmith dev server (sandbox)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Múltiplas contas Google | v2 — requer auth dinâmica |
| Frontend/UI própria | Futuro — v1 usa LangSmith sandbox |
| Auth dinâmica de usuários | v2 — v1 usa config estática |
| Eventos recorrentes (séries) | Complexidade desnecessária para v1 |
| Notificações/lembretes | Fora do escopo de assistente de agenda v1 |
| Integração com outros serviços (email, tarefas) | Futuras responsabilidades do assistente |

---

## User Stories

### P1: Criar Evento ⭐ MVP

**User Story**: Como usuário, quero criar eventos no Google Calendar informando descrição, data/hora e calendário via linguagem natural, para não precisar abrir a interface do Google Calendar.

**Why P1**: Funcionalidade core — sem criação de eventos, o assistente não tem utilidade.

**Acceptance Criteria**:

1. WHEN usuário informa descrição, data, hora e duração THEN sistema SHALL criar o evento no Google Calendar com todos os campos informados
2. WHEN usuário informa descrição e data/hora mas NÃO informa duração THEN sistema SHALL criar evento com duração padrão de 30 minutos
3. WHEN usuário NÃO informa calendário THEN sistema SHALL criar evento no calendário default ("Work")
4. WHEN usuário informa calendário específico THEN sistema SHALL criar evento nesse calendário
5. WHEN já existe evento no mesmo horário THEN sistema SHALL retornar erro "Já existe um evento para esse horário"
6. WHEN não há disponibilidade no horário solicitado THEN sistema SHALL retornar mensagem informando indisponibilidade E listar opções de dias/horários livres dentro da semana
7. WHEN evento for criado com sucesso THEN sistema SHALL confirmar com detalhes do evento criado (título, data, hora, duração, calendário)
8. WHEN faltar alguma informação, THEN sistema SHALL perguntar detalhes que faltam (título, data, hora)

**Independent Test**: Enviar prompt "Crie um evento 'Follow-up projeto' para amanhã às 10hrs, 30 minutos" e verificar que o evento aparece no Google Calendar.

---

### P1: Listar Eventos ⭐ MVP

**User Story**: Como usuário, quero consultar meus eventos por dia ou semana via linguagem natural, para saber rapidamente meus compromissos.

**Why P1**: Leitura de agenda é fundamental — necessário para verificar disponibilidade e contexto.

**Acceptance Criteria**:

1. WHEN usuário pergunta eventos de um dia específico THEN sistema SHALL listar todos os eventos do dia com horário, título e calendário
2. WHEN usuário pergunta eventos da semana THEN sistema SHALL listar todos os eventos da semana agrupados por dia
3. WHEN usuário pergunta se está livre em horário específico THEN sistema SHALL verificar e responder se há eventos próximos àquele horário
4. WHEN usuário pergunta quais dias tem livres na semana THEN sistema SHALL listar os dias sem eventos
5. WHEN não há eventos no período consultado THEN sistema SHALL retornar "Nenhum evento encontrado para o dia ou semana"

**Independent Test**: Enviar prompt "Quais meus compromissos de amanhã?" e verificar que retorna lista consistente com o Google Calendar.

---

### P1: Deletar Evento ⭐ MVP

**User Story**: Como usuário, quero deletar eventos via linguagem natural informando descrição ou data/hora, para gerenciar minha agenda sem abrir o Google Calendar.

**Why P1**: CRUD completo é essencial para o assistente ser útil no dia-a-dia.

**Acceptance Criteria**:

1. WHEN usuário solicita deletar evento por descrição THEN sistema SHALL localizar o evento e pedir confirmação antes de deletar
2. WHEN usuário solicita deletar evento por data/hora THEN sistema SHALL localizar o evento naquele horário e pedir confirmação
3. WHEN usuário confirma deleção THEN sistema SHALL deletar o evento do Google Calendar e confirmar a remoção
4. WHEN existem múltiplos eventos correspondentes THEN sistema SHALL listar todos e pedir que o usuário escolha qual deletar
5. WHEN evento não é encontrado THEN sistema SHALL retornar "Evento não encontrado"
6. WHEN usuário cancela/nega a confirmação THEN sistema SHALL manter o evento e informar que a operação foi cancelada

**Independent Test**: Enviar prompt "Delete o evento 'Apresentação do projeto'" → confirmar → verificar que foi removido do Google Calendar.

---

### P1: Editar Evento ⭐ MVP

**User Story**: Como usuário, quero editar eventos existentes via linguagem natural, para ajustar detalhes sem abrir o Google Calendar.

**Why P1**: Complementa o CRUD — sem edição, o usuário precisaria deletar e recriar eventos.

**Acceptance Criteria**:

1. WHEN usuário solicita editar evento por descrição THEN sistema SHALL localizar o evento e perguntar quais campos alterar
2. WHEN usuário informa novos valores (título, data, hora, duração, calendário) THEN sistema SHALL atualizar o evento no Google Calendar
3. WHEN existem múltiplos eventos correspondentes THEN sistema SHALL listar todos e pedir que o usuário escolha qual editar
4. WHEN evento não é encontrado THEN sistema SHALL retornar "Evento não encontrado"
5. WHEN novo horário conflita com evento existente THEN sistema SHALL retornar erro de conflito e sugerir alternativas

**Independent Test**: Enviar prompt "Editar evento 'Apresentação do projeto'" → informar novo horário → verificar atualização no Google Calendar.

---

### P2: Seleção de Calendário Inteligente

**User Story**: Como usuário, quero que o agente gerencie múltiplos calendários e me permita escolher em qual calendário operar.

**Why P2**: Importante para organização, mas o MVP funciona com calendário default.

**Acceptance Criteria**:

1. WHEN usuário não especifica calendário em qualquer operação THEN sistema SHALL usar calendário default ("Work")
2. WHEN usuário especifica calendário por nome THEN sistema SHALL operar nesse calendário
3. WHEN usuário pede para listar calendários disponíveis THEN sistema SHALL retornar lista de calendários da conta Google
4. WHEN calendário informado não existe THEN sistema SHALL informar erro e listar calendários disponíveis

**Independent Test**: Enviar "Crie evento 'Dentista' amanhã às 14h no calendário Pessoal" e verificar que criou no calendário correto.

---

### P2: Sugestão de Horários Livres

**User Story**: Como usuário, quero que o agente sugira horários alternativos quando há conflito, para facilitar o reagendamento.

**Why P2**: Melhora a experiência mas não bloqueia o MVP.

**Acceptance Criteria**:

1. WHEN há conflito de horário ao criar/editar evento THEN sistema SHALL listar horários livres disponíveis na mesma semana
2. WHEN usuário pergunta horários livres em um dia/semana THEN sistema SHALL calcular e retornar slots disponíveis
3. WHEN não há horários livres na semana THEN sistema SHALL informar e sugerir a próxima semana com disponibilidade

**Independent Test**: Tentar criar evento em horário ocupado e verificar que sugere alternativas válidas.

---

## Edge Cases

- WHEN prompt é ambíguo e não é possível determinar intent THEN sistema SHALL pedir esclarecimento ao usuário
- WHEN Google Calendar API retorna erro (rate limit, auth expirada) THEN sistema SHALL retornar mensagem amigável de erro e sugerir tentar novamente
- WHEN usuário informa data no passado THEN sistema SHALL alertar que a data é no passado e pedir confirmação
- WHEN prompt contém múltiplas ações (ex: "crie e delete") THEN sistema SHALL processar uma ação por vez, começando pela primeira
- WHEN formato de data/hora é ambíguo THEN sistema SHALL interpretar no contexto mais provável (futuro próximo) e confirmar com o usuário
- WHEN token OAuth2 do Google expira THEN sistema SHALL tentar refresh automaticamente; se falhar, logar erro

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| CAL-01 | P1: Criar Evento — criar com todos os campos | Specify | Pending |
| CAL-02 | P1: Criar Evento — duração padrão 30min | Specify | Pending |
| CAL-03 | P1: Criar Evento — calendário default "Work" | Specify | Pending |
| CAL-04 | P1: Criar Evento — calendário específico | Specify | Pending |
| CAL-05 | P1: Criar Evento — erro de duplicidade | Specify | Pending |
| CAL-06 | P1: Criar Evento — indisponibilidade + sugestões | Specify | Pending |
| CAL-07 | P1: Criar Evento — confirmação com detalhes | Specify | Pending |
| CAL-37 | P1: Criar Evento — perguntar info faltante | Specify | Pending |
| CAL-08 | P1: Listar Eventos — eventos do dia | Specify | Pending |
| CAL-09 | P1: Listar Eventos — eventos da semana | Specify | Pending |
| CAL-10 | P1: Listar Eventos — verificar disponibilidade | Specify | Pending |
| CAL-11 | P1: Listar Eventos — dias livres da semana | Specify | Pending |
| CAL-12 | P1: Listar Eventos — nenhum evento encontrado | Specify | Pending |
| CAL-13 | P1: Deletar Evento — por descrição + confirmação | Specify | Pending |
| CAL-14 | P1: Deletar Evento — por data/hora + confirmação | Specify | Pending |
| CAL-15 | P1: Deletar Evento — confirmar e deletar | Specify | Pending |
| CAL-16 | P1: Deletar Evento — desambiguação múltiplos | Specify | Pending |
| CAL-17 | P1: Deletar Evento — evento não encontrado | Specify | Pending |
| CAL-18 | P1: Deletar Evento — cancelar operação | Specify | Pending |
| CAL-19 | P1: Editar Evento — localizar e perguntar campos | Specify | Pending |
| CAL-20 | P1: Editar Evento — atualizar campos | Specify | Pending |
| CAL-21 | P1: Editar Evento — desambiguação múltiplos | Specify | Pending |
| CAL-22 | P1: Editar Evento — evento não encontrado | Specify | Pending |
| CAL-23 | P1: Editar Evento — conflito no novo horário | Specify | Pending |
| CAL-24 | P2: Seleção Calendário — default "Work" | Specify | Pending |
| CAL-25 | P2: Seleção Calendário — específico por nome | Specify | Pending |
| CAL-26 | P2: Seleção Calendário — listar disponíveis | Specify | Pending |
| CAL-27 | P2: Seleção Calendário — calendário inexistente | Specify | Pending |
| CAL-28 | P2: Sugestão Horários — listar livres em conflito | Specify | Pending |
| CAL-29 | P2: Sugestão Horários — calcular slots disponíveis | Specify | Pending |
| CAL-30 | P2: Sugestão Horários — sem horários livres | Specify | Pending |
| CAL-31 | Edge: prompt ambíguo → pedir esclarecimento | Specify | Pending |
| CAL-32 | Edge: erro Google API → mensagem amigável | Specify | Pending |
| CAL-33 | Edge: data no passado → alertar e confirmar | Specify | Pending |
| CAL-34 | Edge: múltiplas ações → processar uma por vez | Specify | Pending |
| CAL-35 | Edge: data/hora ambígua → interpretar + confirmar | Specify | Pending |
| CAL-36 | Edge: OAuth token expirado → refresh automático | Specify | Pending |

**Coverage:** 37 total, 0 mapped to tasks, 37 unmapped ⚠️

---

## Success Criteria

- [ ] Usuário consegue criar evento via prompt e evento aparece no Google Calendar
- [ ] Usuário consegue listar eventos do dia/semana e resultado é consistente com o Calendar
- [ ] Usuário consegue deletar evento com confirmação
- [ ] Usuário consegue editar evento existente
- [ ] Conflitos de horário são detectados e alternativas sugeridas
- [ ] Agente funciona e é testável via LangSmith sandbox
- [ ] Agente responde sempre em PT-BR
