import { z } from 'zod';

export const IdentifyIntentSchema = z.object({
  intent: z.enum([
    'create',
    'list',
    'delete',
    'edit',
    'check_availability',
    'unknown',
  ]),
  eventSummary: z.string().optional(),
  eventDateTime: z.string().optional(),
  eventDuration: z.number().optional(),
  calendarId: z.string().optional(),
  queryDateRangeStart: z.string().optional(),
  queryDateRangeEnd: z.string().optional(),
});

export type IdentifyIntentOutput = z.infer<typeof IdentifyIntentSchema>;

export function getSystemPrompt(currentDate: string): string {
  return `Você é um assistente que classifica a intenção do usuário sobre gerenciamento de agenda.
A data atual é: ${currentDate}.

Classifique a mensagem em uma das intenções:
- "create": criar um novo evento
- "list": listar eventos de um dia, semana ou período
- "delete": deletar um evento existente
- "edit": editar um evento existente
- "check_availability": verificar se está livre em um horário ou quais dias tem livres
- "unknown": não é possível determinar a intenção

Extraia também os dados relevantes:
- eventSummary: título/descrição do evento mencionado
- eventDateTime: data e hora mencionada (formato ISO 8601). Interprete datas relativas como "amanhã", "próxima segunda", etc. em relação à data atual
- eventDuration: duração em minutos, se mencionada
- calendarId: nome do calendário, se mencionado
- queryDateRangeStart/End: período de consulta (para "list" e "check_availability")

Se a mensagem for ambígua sobre data/hora, interprete no futuro mais próximo.
Sempre responda com dados estruturados conforme o schema.`;
}

export function getUserPromptTemplate(): string {
  return `Mensagem do usuário: {message}`;
}
