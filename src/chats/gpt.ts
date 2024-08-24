import OpenAI from "openai";
import { ConclaveMemberConfig } from "../config";
import { ConclaveMember } from "../types/ConclaveMember";

export class GPTChat implements ConclaveMember {
  private openai: OpenAI;
  private config: ConclaveMemberConfig;

  constructor(config: ConclaveMemberConfig) {
    this.config = config;
    const apiKey = process.env[this.config.apiKeyEnv];

    if (!apiKey) {
      throw new Error("Environment variable not found: " + this.config.apiKeyEnv);
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  name() {
    return this.config.name;
  }

  async sendMessage(userMessage: string, instructions: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        max_tokens: Number(this.config.options.max_tokens ?? 1000),
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: userMessage },
        ],
      });

      return {
        text: response.choices[0].message.content ?? "",
        raw: response,
      };
    } catch (error) {
      console.error("Error sending message to GPT:", error);
      throw error;
    }
  }
}
