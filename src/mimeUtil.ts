import mime from "mime-types";

export function getMimeType(filePath: string): string {
  const mimeType = mime.lookup(filePath);
  return mimeType || "application/octet-stream";
}
