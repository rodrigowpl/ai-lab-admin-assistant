import { z } from 'zod';

export const ConfirmSchema = z.object({
  confirmed: z.boolean(),
  selectedIndex: z.number().nullable().optional(),
});

export type ConfirmOutput = z.infer<typeof ConfirmSchema>;

export function getSystemPrompt(): string {
  return `Você é um assistente que analisa respostas de confirmação do usuário.
Determine se o usuário está confirmando (sim) ou negando (não) uma ação.

Sinais de confirmação: "sim", "confirma", "pode fazer", "ok", "isso", "s", "yes", "confirmo"
Sinais de negação: "não", "cancela", "n", "no", "deixa", "não quero", "esquece"

Se o usuário escolheu um item de uma lista (ex: "o segundo", "o 1", "opção 2"), retorne o índice (0-based) em selectedIndex.

Sempre responda com dados estruturados.`;
}

export function getUserPromptTemplate(): string {
  return `Mensagem do usuário: {message}
Contexto da confirmação: {confirmContext}`;
}
