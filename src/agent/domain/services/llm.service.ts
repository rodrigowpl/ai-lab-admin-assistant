import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { type ZodType } from 'zod';
import { ConfigService } from '../../../shared/module/config/index.js';

@Injectable()
export class LlmService {
  private readonly model: ChatOpenAI;

  constructor(private readonly config: ConfigService) {
    const { apiKey, baseUrl, model } = this.config.llm;

    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      configuration: {
        baseURL: baseUrl,
      },
    });
  }

  async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const structuredModel = this.model.withStructuredOutput(schema);

    const result = await structuredModel.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return result as T;
  }

  getModel(): ChatOpenAI {
    return this.model;
  }
}
