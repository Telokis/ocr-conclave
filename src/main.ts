import { ocr } from "./ocr";
import { PROJECT_ID, LOCATION, PROCESSOR_ID, DEFAULT_LANGUAGE } from "./env";
import { makeBbcodeText } from "./bbcode";
import path from "node:path";

async function main() {
    // const filePath = path.resolve(__dirname,"../data/Nuit des rois/Acte I/20240821_190706.jpg"); // Vers
    const filePath = path.resolve(__dirname, "../data/Nuit des rois/Acte II/20240822_163700.jpg"); // Prose

    try {
        console.log(`PROJECT_ID: ${PROJECT_ID}`);
        console.log(`LOCATION: ${LOCATION}`);
        console.log(`PROCESSOR_ID: ${PROCESSOR_ID}`);
        console.log(`DEFAULT_LANGUAGE: ${DEFAULT_LANGUAGE}`);

        const processedDocument = await ocr(filePath);
        console.log("--------------");
        console.log(processedDocument.document!.text);
        console.log("--------------");
        console.log(makeBbcodeText(processedDocument));
        console.log("--------------");
    } catch (error) {
        console.error("Error processing document:", error);
    }
}

main();
