import path from "node:path";
import Conclave from "./Conclave";
import config from "./config";
import { Glob } from "bun";
import formatDuration, { formatDate } from "./datetime";
import { stageOcr } from "./stages/stageOcr";
import { stageTextCleanup } from "./stages/stageTextCleanup";
import { stageVoting } from "./stages/stageVoting";
import { Storage } from "./Storage";
import { writeFile, appendFile } from "node:fs/promises";

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
    await writeFile(config.output.local_file, "", "utf-8");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storage = new Storage(file);
      const filePath = path.resolve(config.input.root, file);
      const start = Date.now();
      const startStr = formatDate(new Date(start), "%Y-%M-%D %h:%m:%s");
      console.log(`[${startStr}] Processing (${i + 1}/${files.length})`, file);

      // Stage 1: OCR
      const ocrResult = await stageOcr(filePath, storage);
      console.log(ocrResult); // Only print for now
      console.log("---\n\n\n");

      // Stage 2: Text Cleanup
      const cleanupResults = await stageTextCleanup(conclave, ocrResult, storage, previousPage);
      console.log("Text cleanup Results:", cleanupResults);
      console.log("---\n\n\n");

      // Stage 3: Voting
      const electedText = await stageVoting(
        conclave,
        ocrResult,
        cleanupResults,
        storage,
        previousPage,
      );
      console.log("Voting Result:");
      console.log(electedText);
      console.log("---\n\n\n");

      storage.setFinalText(electedText);

      await appendFile(
        config.output.local_file,
        (electedText.startsWith("[") ? "\n" : "") + electedText + "\n",
        "utf-8",
      );

      const end = Date.now();
      const endStr = formatDate(new Date(end), "%Y-%M-%D %h:%m:%s");
      console.log(`[${endStr}] Finished processing file in`, formatDuration(end - start));
      console.log("--------------------");

      previousPage = electedText;
    }
  } catch (error) {
    console.error("Error processing document:", error);
  }

  console.log("Done processing files");
}

main();
