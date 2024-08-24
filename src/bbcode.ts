import type { protos } from "@google-cloud/documentai";

export function makeBbcodeText(
  responseData: protos.google.cloud.documentai.v1.IProcessResponse,
): string {
  // Extract the document text and tokens
  const document = responseData.document!;
  const text = document.text ?? "";
  const tokens = document.pages?.flatMap((page) => page.tokens ?? []) ?? [];

  // Sort tokens by their start index
  tokens.sort((a, b) => {
    const aStart = parseInt(String(a.layout?.textAnchor?.textSegments?.[0]?.startIndex ?? "0"), 10);
    const bStart = parseInt(String(b.layout?.textAnchor?.textSegments?.[0]?.startIndex ?? "0"), 10);
    return aStart - bStart;
  });

  // Initialize variables
  const output: string[] = [];
  let currentPosition = 0;
  let inItalic = false;

  // Process tokens
  for (const token of tokens) {
    const startIndex = parseInt(
      String(token.layout?.textAnchor?.textSegments?.[0]?.startIndex ?? "0"),
      10,
    );
    const endIndex = parseInt(
      String(token.layout?.textAnchor?.textSegments?.[0]?.endIndex ?? "0"),
      10,
    );
    const isItalic = token.styleInfo?.italic ?? false;

    // Add non-token text
    if (startIndex > currentPosition) {
      output.push(text.substring(currentPosition, startIndex));
    }

    // Handle italic changes
    if (isItalic && !inItalic) {
      output.push("[i]");
      inItalic = true;
    } else if (!isItalic && inItalic) {
      output.push("[/i]");
      inItalic = false;
    }

    // Add token text
    output.push(text.substring(startIndex, endIndex));
    currentPosition = endIndex;
  }

  // Close any open italic tag
  if (inItalic) {
    output.push("[/i]");
  }

  // Add any remaining text
  if (currentPosition < text.length) {
    output.push(text.substring(currentPosition));
  }

  // Join the output and post-process
  let result = output.join("");

  // Post-processing to minimize tags
  result = result.replaceAll("[/i][i]", "");
  result = result.replaceAll("[i][/i]", "");

  return result;
}
