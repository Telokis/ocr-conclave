import Conclave from "../Conclave";
import { getTextCleanupInstructions } from "../getInstructions";
import { fixMalformedJson } from "../json";
import { Storage, Stage, ConclaveReponseWithJson, CleanupStageData } from "../Storage";
import { isResponseOk, TextCleanupResponse } from "../types/TextCleanup";

export async function stageTextCleanup(
  conclave: Conclave,
  ocrResult: string,
  storage: Storage,
  previousPage?: string,
): Promise<Array<string>> {
  // Check if cleanup stage has already been completed
  if (storage.hasReachedOrPassedStage(Stage.CLEANUP)) {
    console.log("Cleanup stage already completed. Retrieving stored results.");

    return storage.getData().cleanupStage!.cleanedTexts;
  }

  const instructions = getTextCleanupInstructions(previousPage);

  try {
    const cleanupResults = await conclave.askMembers(ocrResult, instructions);
    const parsedResults: Array<string> = [];
    const rawResults: Array<ConclaveReponseWithJson> = [];

    for (const result of cleanupResults) {
      const rawText = result.response.text;

      console.log("--------------------------", result.name);
      console.log(JSON.stringify(rawText));

      const jsonContent = JSON.parse(fixMalformedJson(rawText)) as TextCleanupResponse;

      rawResults.push({ ...result, fullJsonResponse: jsonContent });

      console.log(`Text cleanup result from ${result.name}: ${jsonContent.status}`);
      console.log("---");
      console.log("---");
      console.log(isResponseOk(jsonContent) ? ocrResult : jsonContent.correctedText);
      console.log("---");
      console.log("---");
      console.log(jsonContent.explanation);
      console.log("--------------------------");

      if (isResponseOk(jsonContent)) {
        parsedResults.push(ocrResult);
      } else {
        parsedResults.push(jsonContent.correctedText);
      }
    }

    // Store both raw and cleaned results
    const cleanupData: CleanupStageData = {
      prompts: {
        instructions: instructions,
        user: ocrResult,
      },
      rawResults: rawResults,
      cleanedTexts: parsedResults,
    };

    storage.addCleanupStage(cleanupData);

    return parsedResults;
  } catch (error) {
    console.error("Error in text cleanup stage:", error);
    throw error;
  }
}
