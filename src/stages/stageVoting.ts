import Conclave from "../Conclave";
import { getVotingInstructions } from "../getInstructions";
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
  previousPage?: string,
): Promise<string> {
  const totalVotePoints = 10;
  const instructions = getVotingInstructions(previousPage, totalVotePoints);

  // Prepare the voting prompt
  const votingPrompt = prepareVotingPrompt(ocrResult, cleanupResults);

  try {
    const votingResults = await conclave.askMembers(votingPrompt, instructions);

    const totalVotes: Record<string, number> = {};

    votingResults.forEach((result) => {
      const rawText = result.response.text;

      console.log("--------------------------", result.name);
      console.log(JSON.stringify(rawText));

      const voteResponse = JSON.parse(rawText) as VotingResponse;

      console.log(`Voting result from ${result.name}:`);
      console.log("---");
      console.log("---");
      console.log(
        Object.entries(voteResponse.votes)
          .map(([version, votes]) => `Version ${version}: ${votes}`)
          .join("\n"),
      );
      console.log("---");
      console.log("---");
      console.log(voteResponse.human_readable);
      console.log("--------------------------");

      if (!validateVotes(voteResponse.votes, totalVotePoints)) {
        console.error(
          `Invalid vote from ${result.name}: Total votes do not add up to ${totalVotePoints}`,
        );
        throw new Error(
          `Invalid vote from ${result.name}: Total votes do not add up to ${totalVotePoints}`,
        );
      }

      Object.entries(voteResponse.votes).forEach(([version, votes]) => {
        totalVotes[version] = (totalVotes[version] ?? 0) + votes;
      });

      console.log("--------------------------");
    });

    const winningVersion = Object.entries(totalVotes).reduce((a, b) =>
      totalVotes[a[0]] > totalVotes[b[0]] ? a : b,
    )[0];

    // Return the winning version
    if (winningVersion === "0") {
      return ocrResult;
    } else {
      return cleanupResults[parseInt(winningVersion) - 1];
    }
  } catch (error) {
    console.error("Error in voting stage:", error);
    throw error;
  }
}
