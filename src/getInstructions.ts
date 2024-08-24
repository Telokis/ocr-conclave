import config from "./config";

interface Variables {
  [key: string]: string;
}

function replaceVariables(text: string, variables: Variables): string {
  let prevText: string;
  let currentText = text;

  do {
    prevText = currentText;

    for (const [key, value] of Object.entries(variables)) {
      currentText = currentText.replaceAll(`{{${key}}}`, value);
    }
  } while (currentText !== prevText);

  return currentText;
}

export function getTextCleanupInstructions(previousPage?: string): string {
  const vars: Variables = {
    ...config.stagesSettings.vars,
    PREVIOUS_PAGE_EXAMPLE: previousPage ? config.stagesSettings.vars.PREVIOUS_PAGE_EXAMPLE : "",
    PREVIOUS_PAGE: previousPage ?? "",
  };

  const instructions = config.stagesSettings.textCleanup.systemInstructions;

  return replaceVariables(instructions, vars);
}

export function getVotingInstructions(
  previousPage: string | undefined,
  votingPoints: number,
): string {
  const vars: Variables = {
    ...config.stagesSettings.vars,
    VOTING_POINTS: String(votingPoints),
    PREVIOUS_PAGE_EXAMPLE: previousPage ? config.stagesSettings.vars.PREVIOUS_PAGE_EXAMPLE : "",
    PREVIOUS_PAGE: previousPage ?? "",
  };

  const instructions = config.stagesSettings.voting.systemInstructions;

  return replaceVariables(instructions, vars);
}
