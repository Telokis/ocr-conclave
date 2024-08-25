import Conclave from "../Conclave";
import { getVotingInstructions } from "../getInstructions";
import { fixMalformedJson } from "../json";
import { Storage, Stage, ConclaveReponseWithJson, VotingStageData } from "../Storage";
import { VotingResponse } from "../types/Voting";

function prepareVotingPrompt(ocrResult: string, cleanupResults: string[]): string {
  let prompt = `Version 0:\n${ocrResult}\n\n`;

  cleanupResults.forEach((result, index) => {
    prompt += `Version ${index + 1}:\n${result}\n\n`;
  });

  return prompt;
}

function validateVotes(votes: Record<string, number>, expectedTotal: number): boolean {
  const sum = Object.values(votes).reduce((a, b) => a + b, 0);
  return sum === expectedTotal;
}

export async function stageVoting(
  conclave: Conclave,
  ocrResult: string,
  cleanupResults: string[],
  storage: Storage,
  previousPage?: string,
): Promise<string> {
  // Check if voting stage has already been completed
  if (storage.hasReachedOrPassedStage(Stage.VOTING)) {
    console.log("Voting stage already completed. Retrieving stored results.");
    return storage.getData().votingStage!.selectedText;
  }

  const totalVotePoints = 10;
  const instructions = getVotingInstructions(previousPage, totalVotePoints);
  const votingPrompt = prepareVotingPrompt(ocrResult, cleanupResults);

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxAttempts}`);

    try {
      const votingResults = await conclave.askMembers(votingPrompt, instructions);

      const totalVotes: Record<string, number> = {};
      const rawResults: Array<ConclaveReponseWithJson> = [];
      let invalidVotes = false;

      for (const result of votingResults) {
        const rawText = result.response.text;
        console.log("--------------------------", result.name);
        console.log(JSON.stringify(rawText));

        const voteResponse = JSON.parse(fixMalformedJson(rawText)) as VotingResponse;
        rawResults.push({ ...result, fullJsonResponse: voteResponse });

        console.log(`Voting result from ${result.name}:`);
        console.log("---");
        console.log(
          Object.entries(voteResponse.votes)
            .map(([version, votes]) => `Version ${version}: ${votes}`)
            .join("\n"),
        );
        console.log("---");
        console.log(voteResponse.explanation);
        console.log("--------------------------");

        if (!validateVotes(voteResponse.votes, totalVotePoints)) {
          console.error(
            `Invalid vote from ${result.name}: Total votes do not add up to ${totalVotePoints}`,
          );
          invalidVotes = true;
          break;
        }

        Object.entries(voteResponse.votes).forEach(([version, votes]) => {
          totalVotes[version] = (totalVotes[version] ?? 0) + votes;
        });
      }

      if (invalidVotes) {
        console.log(`Invalid votes detected. Retrying...`);
        continue;
      }

      const winningVersion = Object.entries(totalVotes).reduce((a, b) =>
        totalVotes[a[0]] > totalVotes[b[0]] ? a : b,
      )[0];

      const selectedText =
        winningVersion === "0" ? ocrResult : cleanupResults[parseInt(winningVersion) - 1];

      const votingData: VotingStageData = {
        prompts: {
          instructions: instructions,
          user: votingPrompt,
        },
        rawResults: rawResults,
        totalVotes: totalVotes,
        selectedText: selectedText,
      };

      storage.addVotingStage(votingData);

      return selectedText;
    } catch (error) {
      console.error(`Error in voting stage (Attempt ${attempts}):`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error(`Failed to complete voting stage after ${maxAttempts} attempts`);
}
