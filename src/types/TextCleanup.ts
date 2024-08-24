/** Received when the text is fine as-is. */
interface OkResponse {
  /** Indicates that the original text is fine. */
  status: "OK";

  /** A human-readable explanation of your decision. */
  human_readable: string;
}

/** Received when the text requires corrections. */
interface KoResponse {
  /**
   * Indicates that the original text requires corrections.
   */
  status: "KO";

  /**
   * The corrected text. This should be a corrected version of the original text.
   */
  correctedText: string;

  /** A human-readable explanation of your decision. */
  human_readable: string;
}

export type TextCleanupResponse = OkResponse | KoResponse;

export function isResponseOk(response: TextCleanupResponse): response is OkResponse {
  return response.status === "OK";
}
