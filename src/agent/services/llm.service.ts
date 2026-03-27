import { ChatOpenAI } from "@langchain/openai";
import { type ZodType } from "zod";
import { type Config } from "../../lib/config.ts";

export class LlmService {
  private readonly model: ChatOpenAI;

  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    const { apiKey, baseUrl, model } = this.config.llm;

    this.model = new ChatOpenAI({
      model,
      temperature: 0,
      apiKey,
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
    const structuredModel = this.model.withStructuredOutput(schema, {
      method: "functionCalling",
      strict: false,
    });

    const result = await structuredModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return result as T;
  }

  getModel(): ChatOpenAI {
    return this.model;
  }
}
