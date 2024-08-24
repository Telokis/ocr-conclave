import { Anthropic } from "@anthropic-ai/sdk";
import type { TextBlock } from "@anthropic-ai/sdk/resources";

export class ClaudeChat {
    private anthropic: Anthropic;

    constructor(apiKey: string) {
        this.anthropic = new Anthropic({
            apiKey: apiKey,
        });
    }

    async sendMessage(
        message: string,
        model: string = "claude-3-5-sonnet-20240620",
    ): Promise<string> {
        try {
            const response = await this.anthropic.messages.create({
                model: model,
                max_tokens: 1000,
                messages: [{ role: "user", content: message }],
            });

            return (response.content[0] as TextBlock).text;
        } catch (error) {
            console.error("Error sending message to Claude:", error);
            throw error;
        }
    }
}
