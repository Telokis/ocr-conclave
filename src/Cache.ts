import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import config from "./config";
import { md5Hash } from "./md5";
import { protos } from "@google-cloud/documentai";

if (!existsSync(config.cache.root_dir)) {
  mkdirSync(config.cache.root_dir);
}

export class Cache {
  static _cacheKey(filePath: string) {
    const filename = basename(filePath, extname(filePath));
    const hash = md5Hash(filePath);

    return `${filename}-${hash}.json`;
  }

  static getPathFor(filePath: string, cacheSubDir: string = "") {
    return resolve(config.cache.root_dir, cacheSubDir, this._cacheKey(filePath));
  }

  static has(filePath: string, cacheSubDir: string = "") {
    return existsSync(Cache.getPathFor(filePath, cacheSubDir));
  }

  static get(filePath: string, cacheSubDir: string = "") {
    return JSON.parse(readFileSync(Cache.getPathFor(filePath, cacheSubDir), "utf8"));
  }

  static set(
    filePath: string,
    cacheSubDir: string = "",
    data: protos.google.cloud.documentai.v1.IProcessResponse,
    imageData: Buffer,
  ) {
    const cachePath = Cache.getPathFor(filePath, cacheSubDir);
    const cacheDirName = dirname(cachePath);
    const cacheFileName = basename(cachePath, extname(cachePath));

    const imageFileName = `${cacheFileName}-image${extname(filePath)}`;

    if (!existsSync(cacheDirName)) {
      mkdirSync(cacheDirName, { recursive: true });
    }

    writeFileSync(resolve(cacheDirName, imageFileName), imageData);

    for (const page of data.document!.pages!) {
      delete page.image;
      (page.image as unknown as string) = imageFileName;
    }

    writeFileSync(cachePath, JSON.stringify(data, null, 1));
  }
}
