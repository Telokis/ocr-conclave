import { makeBbcodeText } from "../bbcode";
import { ocr } from "../ocr";
import { dirname } from "node:path";

export async function stageOcr(filePath: string, file: string) {
  const processedDocument = await ocr(filePath, dirname(file));

  return makeBbcodeText(processedDocument);
}
