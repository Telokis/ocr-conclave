import { ClaudeChat } from "./chats/claude";
import { GeminiChat } from "./chats/gemini";
import { GPTChat } from "./chats/gpt";
import { ConclaveMemberConfig } from "./config";
import { ConclaveMember, ConclaveMemberMessageResponse } from "./types/ConclaveMember";

export interface ConclaveResponse {
  name: string;
  response: ConclaveMemberMessageResponse;
}

export default class Conclave {
  private members: ConclaveMember[];

  constructor(conclaveConfig: Array<ConclaveMemberConfig>) {
    this.members = conclaveConfig.map((memberConfig) => {
      switch (memberConfig.type) {
        case "gpt":
          return new GPTChat(memberConfig);
        case "gemini":
          return new GeminiChat(memberConfig);
        case "claude":
          return new ClaudeChat(memberConfig);
        default:
          throw new Error("Unknown member type: " + memberConfig.type);
      }
    });
  }

  askMembers(userMessage: string, instructions: string): Promise<Array<ConclaveResponse>> {
    return Promise.all(
      this.members.map(async (member) => {
        try {
          const response = await member.sendMessage(userMessage, instructions);

          return {
            name: member.name(),
            response,
          };
        } catch (error) {
          console.error(`Error sending message to ${member.name()}:`, error);

          throw error;
        }
      }),
    );
  }
}
