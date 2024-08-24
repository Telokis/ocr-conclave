import OpenAI from "openai";

export class ChatGPTChat {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({
            apiKey: apiKey,
        });
    }

    async sendMessage(message: string, model: string = "gpt-4o-mini"): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: model,
                max_tokens: 1000,
                messages: [{ role: "user", content: message }],
            });

            return response.choices[0].message.content ?? "";
        } catch (error) {
            console.error("Error sending message to ChatGPT:", error);
            throw error;
        }
    }
}
