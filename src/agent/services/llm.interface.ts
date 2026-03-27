import { type ZodType } from 'zod';
import { type ChatOpenAI } from '@langchain/openai';

export interface ILlmService {
  generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodType<T>,
  ): Promise<T>;
  getModel(): ChatOpenAI;
}
