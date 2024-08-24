export interface ConclaveMemberMessageResponse {
  text: string;
  raw: unknown;
}

export interface ConclaveMember {
  sendMessage(message: string, instructions: string): Promise<ConclaveMemberMessageResponse>;
  name(): string;
}
