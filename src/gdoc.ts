import { google } from "googleapis";
import fs from "fs";

import { GDOC_OAUTH_APP_CREDENIALS } from "./env";

const credentials = JSON.parse(fs.readFileSync(GDOC_OAUTH_APP_CREDENIALS!, "utf8")).installed;
const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0],
);

async function getAuthClient() {
  // Check if we have a token
  try {
    const token = JSON.parse(fs.readFileSync("token.json", "utf8"));
    oauth2Client.setCredentials(token);
  } catch (error) {
    // If no token, get a new one
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/docs"],
    });

    console.log("Authorize this app by visiting this url:", authUrl);
    const code = await new Promise((resolve) => {
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.question("Enter the code from that page here: ", (code) => {
        readline.close();
        resolve(code);
      });
    });

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync("token.json", JSON.stringify(tokens));
  }

  return oauth2Client;
}

async function createDocument(auth: any, title: string) {
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: title,
    mimeType: "application/vnd.google-apps.document",
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });
    return file.data.id!;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

function readInputFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

interface StyleOptions {
  bold?: boolean;
  italic?: boolean;
  fontSize?: { magnitude: number; unit: string };
}

function parseBBCode(input: string): any[] {
  const requests: any[] = [];
  const lines = input.split("\n");
  let index = 1;

  for (const line of lines) {
    if (line.trim() === "") {
      requests.push({
        insertText: {
          location: { index },
          text: "\n",
        },
      });
      index++;
      continue;
    }

    const parts = line.split(/(\[\/?\w+?\])/);
    let currentStyle: StyleOptions = {};

    for (const part of parts) {
      if (part.startsWith("[") && part.endsWith("]")) {
        const tag = part.slice(1, -1);

        if (tag.startsWith("/")) {
          currentStyle = getStyleForTag("_DEFAULT");
        } else {
          currentStyle = getStyleForTag(tag);
        }
      } else if (part.trim() !== "") {
        requests.push({
          insertText: {
            location: { index },
            text: part,
          },
        });
        index += part.length;

        requests.push({
          updateTextStyle: {
            range: {
              startIndex: index - part.length,
              endIndex: index,
            },
            textStyle: currentStyle,
            fields: "bold,italic,fontSize",
          },
        });
      }
    }

    requests.push({
      insertText: {
        location: { index },
        text: "\n",
      },
    });
    index++;
  }

  return requests;
}

function getStyleForTag(tag: string): StyleOptions {
  const defaultStyle: StyleOptions = {
    bold: false,
    italic: false,
    fontSize: { magnitude: 11, unit: "PT" },
  };

  switch (tag) {
    case "i":
      return { ...defaultStyle, italic: true };
    case "title":
      return { ...defaultStyle, bold: true, fontSize: { magnitude: 16, unit: "PT" } };
    case "char":
      return { ...defaultStyle, fontSize: { magnitude: 12, unit: "PT" } };
    case "_DEFAULT":
      return { ...defaultStyle };
    default:
      return { ...defaultStyle };
  }
}

async function main() {
  try {
    const auth = await getAuthClient();

    const docTitle = "Nuit des rois";
    const docId = await createDocument(auth, docTitle);

    const inputContent = readInputFile("./data/full.txt");
    const requests = parseBBCode(inputContent);

    const docs = google.docs({ version: "v1", auth });
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });

    console.log(`Document created successfully. ID: ${docId}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
