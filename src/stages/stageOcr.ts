import { protos } from "@google-cloud/documentai";
import { makeBbcodeText } from "../bbcode";
import { ocr } from "../ocr";
import { Storage, Stage } from "../Storage";

export async function stageOcr(filePath: string, storage: Storage): Promise<string> {
  // Check if OCR stage has already been completed
  if (storage.hasReachedOrPassedStage(Stage.BBCODE)) {
    console.log("BBCODE stage already completed. Skipping.");
    return storage.getData().bbcodeStage!;
  }

  let processedDocument: protos.google.cloud.documentai.v1.IProcessResponse;

  if (storage.hasReachedOrPassedStage(Stage.OCR)) {
    console.log("OCR stage already completed. Skipping.");
    // Retrieve OCR data from storage
    processedDocument = storage.getData().ocrStage!;
  } else {
    // Perform OCR
    const [doc, imageFile] = await ocr(filePath);
    processedDocument = doc;

    // Store OCR results
    storage.addOcrStage(processedDocument, imageFile);
  }

  // Generate BBCode
  const bbcodeText = makeBbcodeText(processedDocument);

  // Store BBCode results
  storage.addBbcodeStage(bbcodeText);

  return bbcodeText;
}
