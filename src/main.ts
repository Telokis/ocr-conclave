import { ocr } from "./ocr";
import { makeBbcodeText } from "./bbcode";
import path, { dirname } from "node:path";
import Conclave from "./Conclave";
import config from "./config";
import { Glob } from "bun";
import formatDuration, { formatDate } from "./datetime";

async function main() {
  const glob = new Glob(config.input.glob);
  const files = (await Array.fromAsync(glob.scan(config.input.root))).sort((a, b) =>
    a.localeCompare(b),
  );

  console.log("About to process", files.length, "files");
  console.log(files[0]);

  const conclave = new Conclave(config.conclave);

  try {
    for (const file of files) {
      const filePath = path.resolve(config.input.root, file);
      const start = Date.now();
      const startStr = formatDate(new Date(start), "%Y-%M-%D %h:%m:%s");
      console.log(`[${startStr}] Processing`, file);
      const processedDocument = await ocr(filePath, dirname(file));
      console.log(makeBbcodeText(processedDocument));
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
