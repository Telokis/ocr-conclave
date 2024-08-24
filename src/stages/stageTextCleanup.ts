import Conclave from "../Conclave";
import { getTextCleanupInstructions } from "../getInstructions";
import { isResponseOk, TextCleanupResponse } from "../types/TextCleanup";

export async function stageTextCleanup(
  conclave: Conclave,
  ocrResult: string,
  previousPage?: string,
): Promise<Array<string>> {
  const instructions = getTextCleanupInstructions(previousPage);

  try {
    const cleanupResults = await conclave.askMembers(ocrResult, instructions);
    const parsedResults = cleanupResults.map((result) => {
      const rawText = result.response.text;

      console.log("--------------------------", result.name);
      console.log(rawText);

      const jsonContent = JSON.parse(rawText) as TextCleanupResponse;

      console.log(`Text cleanup result from ${result.name}: ${jsonContent.status}`);
      console.log("---");
      console.log("---");
      console.log(isResponseOk(jsonContent) ? ocrResult : jsonContent.correctedText);
      console.log("---");
      console.log("---");
      console.log(jsonContent.human_readable);
      console.log("--------------------------");

      if (isResponseOk(jsonContent)) {
        return ocrResult;
      }

      return jsonContent.correctedText;
    });

    return parsedResults;
  } catch (error) {
    console.error("Error in text cleanup stage:", error);
    throw error;
  }
}
