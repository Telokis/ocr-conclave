import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import type { protos } from "@google-cloud/documentai";
import { readFile } from "node:fs/promises";
import { PROJECT_ID, LOCATION, PROCESSOR_ID, DEFAULT_LANGUAGE } from "./env";
import { getMimeType } from "./mimeUtil";
import { Cache } from "./Cache";
import sharp from "sharp";

// Initialize the client
const client = new DocumentProcessorServiceClient({
  fallback: true,
  apiEndpoint: `${LOCATION}-documentai.googleapis.com`,
});

// The full resource name of the processor
const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

export async function ocr(
  filePath: string,
  cacheSubDir: string,
  languageHint: string | undefined = DEFAULT_LANGUAGE,
): Promise<protos.google.cloud.documentai.v1.IProcessResponse> {
  if (Cache.has(filePath, cacheSubDir)) {
    return Cache.get(filePath, cacheSubDir);
  }

  // Read the file into memory
  let imageFile = await readFile(filePath);

  // Preprocess the image
  imageFile = await sharp(imageFile).greyscale().normalize().sharpen().threshold(115).toBuffer();

  // Convert the image data to a Buffer and base64 encode it
  const encodedImage = Buffer.from(imageFile).toString("base64");

  // Determine MIME type
  const mimeType = getMimeType(filePath);

  // Load Binary Data into Document AI RawDocument Object
  const rawDocument: protos.google.cloud.documentai.v1.IRawDocument = {
    content: encodedImage,
    mimeType: mimeType,
  };

  const processOptions: protos.google.cloud.documentai.v1.IProcessOptions = {
    ocrConfig: {
      hints: {
        languageHints: languageHint ? [languageHint] : undefined,
      },
      computeStyleInfo: true,
    },
  };

  // Configure the process request
  const request: protos.google.cloud.documentai.v1.IProcessRequest = {
    name,
    rawDocument,
    processOptions,
  };

  const [result] = await client.processDocument(request);

  Cache.set(filePath, cacheSubDir, result, imageFile);

  return result;
}
