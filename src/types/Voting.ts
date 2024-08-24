export interface VotingResponse {
  /**
   * The votes that were cast.
   * Must contain as many elements as there are candidates.
   * The key is the candidate's index and the number is the number of points they received.
   */
  votes: Record<string, number>;

  /** A human readable string to justify your vote. */
  human_readable: string;
}
