import path from "node:path";
import Conclave from "./Conclave";
import config from "./config";
import { Glob } from "bun";
import formatDuration, { formatDate } from "./datetime";
import { stageOcr } from "./stages/stageOcr";
import { stageTextCleanup } from "./stages/stageTextCleanup";
import { stageVoting } from "./stages/stageVoting";

async function main() {
  const glob = new Glob(config.input.glob);
  const files = (await Array.fromAsync(glob.scan(config.input.root))).sort((a, b) =>
    a.localeCompare(b),
  );

  console.log("About to process", files.length, "files");
  console.log(files[0]);

  const conclave = new Conclave(config.conclave);
  let previousPage: string | undefined;

  try {
    for (const file of files) {
      const filePath = path.resolve(config.input.root, file);
      const start = Date.now();
      const startStr = formatDate(new Date(start), "%Y-%M-%D %h:%m:%s");
      console.log(`[${startStr}] Processing`, file);

      // Stage 1: OCR
      const ocrResult = await stageOcr(filePath, file);
      console.log(ocrResult); // Only print for now
      console.log("---\n\n\n");

      // Stage 2: Text Cleanup
      const cleanupResults = await stageTextCleanup(conclave, ocrResult, previousPage);
      console.log("Text cleanup Results:", cleanupResults);
      console.log("---\n\n\n");

      // Stage 3: Voting
      const electedText = await stageVoting(conclave, ocrResult, cleanupResults, previousPage);
      console.log("Voting Result:");
      console.log(electedText);
      console.log("---\n\n\n");

      const end = Date.now();
      const endStr = formatDate(new Date(end), "%Y-%M-%D %h:%m:%s");
      console.log(`[${endStr}] Finished processing file in`, formatDuration(end - start));
      console.log("--------------------");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error processing document:", error);
  }
}

main();
