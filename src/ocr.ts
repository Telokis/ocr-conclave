import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import type { protos } from "@google-cloud/documentai";
import { readFile } from "node:fs/promises";
import { PROJECT_ID, LOCATION, PROCESSOR_ID, DEFAULT_LANGUAGE } from "./env";
import { getMimeType } from "./mimeUtil";

export async function ocr(
    filePath: string,
    languageHint: string | undefined = DEFAULT_LANGUAGE,
): Promise<protos.google.cloud.documentai.v1.IProcessResponse> {
    // Initialize the client
    const client = new DocumentProcessorServiceClient({
        fallback: true,
        apiEndpoint: `${LOCATION}-documentai.googleapis.com`,
    });

    // The full resource name of the processor
    const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

    // Read the file into memory
    // Read the file into memory
    const imageFile = await readFile(filePath);

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

    return result;
}
