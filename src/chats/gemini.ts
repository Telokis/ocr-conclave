import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiChat {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async sendMessage(message: string, model: string = "gemini-pro"): Promise<string> {
        try {
            const geminiModel = this.genAI.getGenerativeModel({ model: model });

            const result = await geminiModel.generateContent(message);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            throw error;
        }
    }
}
