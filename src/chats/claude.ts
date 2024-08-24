import { Anthropic } from "@anthropic-ai/sdk";
import type { TextBlock } from "@anthropic-ai/sdk/resources";
import { ConclaveMemberConfig } from "../config";
import { ConclaveMember } from "../types/ConclaveMember";

export class ClaudeChat implements ConclaveMember {
  private anthropic: Anthropic;
  private config: ConclaveMemberConfig;

  constructor(config: ConclaveMemberConfig) {
    this.config = config;
    const apiKey = process.env[this.config.apiKeyEnv];

    if (!apiKey) {
      throw new Error("Environment variable not found: " + this.config.apiKeyEnv);
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  name() {
    return this.config.name;
  }

  async sendMessage(userMessage: string, instructions: string) {
    try {
      const response = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: Number(this.config.options.max_tokens ?? 1000),
        system: instructions,
        messages: [{ role: "user", content: userMessage }],
      });

      return {
        text: (response.content[0] as TextBlock).text,
        raw: response,
      };
    } catch (error) {
      console.error("Error sending message to Claude:", error);
      throw error;
    }
  }
}
