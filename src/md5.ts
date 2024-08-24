import { createHash } from "crypto";

export const md5Hash = (str: string) => createHash("md5").update(str).digest("hex");
