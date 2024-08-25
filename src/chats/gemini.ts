import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ConclaveMemberConfig } from "../config";
import { ConclaveMember } from "../types/ConclaveMember";

export class GeminiChat implements ConclaveMember {
  private genAI: GoogleGenerativeAI;
  private config: ConclaveMemberConfig;

  constructor(config: ConclaveMemberConfig) {
    this.config = config;
    const apiKey = process.env[this.config.apiKeyEnv];

    if (!apiKey) {
      throw new Error("Environment variable not found: " + this.config.apiKeyEnv);
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  name() {
    return this.config.name;
  }

  async sendMessage(userMessage: string, instructions: string) {
    try {
      const geminiModel = this.genAI.getGenerativeModel({
        ...this.config.options,
        model: this.config.model,
        systemInstruction: instructions,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const result = await geminiModel.generateContent(userMessage);
      const response = result.response;

      return {
        text: response.text(),
        raw: {
          candidates: response.candidates ?? null,
          promptFeedback: response.promptFeedback ?? null,
          usageMetadata: response.usageMetadata ?? null,
        },
      };
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}
