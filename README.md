# ai-admin-assistant

Assistente de gerenciamento de Google Calendar via linguagem natural. Um agente de IA que entende comandos em portugues para criar, listar, editar e deletar eventos do calendario.

Construido com NestJS, LangGraph e Google Calendar API.

## Tech Stack

| Tecnologia | Uso | Docs |
|---|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Linguagem principal | [Docs](https://www.typescriptlang.org/docs/) |
| [LangChain.js](https://js.langchain.com/) | Orquestracao do agente de IA | [Docs](https://js.langchain.com/docs/) |
| [LangGraph](https://langchain-ai.github.io/langgraphjs/) | Grafo de estado do agente (intent → action → response) | [Docs](https://langchain-ai.github.io/langgraphjs/) |
| [OpenRouter](https://openrouter.ai/) | Gateway para LLMs (default: `gpt-4o-mini`) | [Docs](https://openrouter.ai/docs) |
| [Google Calendar API](https://developers.google.com/calendar) | CRUD de eventos, verificacao de disponibilidade | [Docs](https://developers.google.com/calendar/api/v3/reference) |

## Pre-requisitos

- Node.js >= 20
- Chave de API do [OpenRouter](https://openrouter.ai/)
- Credenciais OAuth2 do Google (Client ID, Client Secret, Refresh Token)

## Rodando em dev

```bash
# 1. Instale as dependencias
yarn install

# 2. Configure as variaveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves (OpenRouter, Google OAuth2, etc.)

# 3. Rode a aplicacao (porta 3000)
yarn start:dev
```

Para testar o agente isoladamente via LangGraph Studio:

```bash
yarn langgraph:dev
```

## Scripts

| Comando | Descricao |
|---|---|
| `yarn build` | Compila TypeScript |
| `yarn start:dev` | Roda com watch mode |
| `yarn start` | Roda em modo producao |
| `yarn langgraph:dev` | Abre sandbox do LangGraph para testar o agente |
| `yarn lint` | Roda ESLint |
| `yarn type-check` | Verifica tipos sem compilar |

## Variaveis de ambiente

Veja `.env.example` para a lista completa. Principais:

| Variavel | Descricao |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret |
| `OPENROUTER_API_KEY` | Chave de API OpenRouter |
| `NLP_MODEL` | Modelo LLM (default: `gpt-4o-mini`) |
| `LANGSMITH_API_KEY` | Chave do LangSmith (opcional, para tracing) |
