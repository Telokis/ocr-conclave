import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import config, { Config, configHash, configWithoutRootDir } from "./config";
import { md5Hash } from "./md5";
import { protos } from "@google-cloud/documentai";
import assert from "node:assert";
import { ConclaveResponse } from "./Conclave";
import { stringifyNoIndent } from "./json";

export enum Stage {
  INITIALIZED = "initialized",
  OCR = "ocrStage",
  BBCODE = "bbcodeStage",
  CLEANUP = "cleanupStage",
  VOTING = "votingStage",
}

function getStageIndex(stage: Stage): number {
  return [Stage.INITIALIZED, Stage.OCR, Stage.BBCODE, Stage.CLEANUP, Stage.VOTING].indexOf(stage);
}

export type ConclaveReponseWithJson = ConclaveResponse & {
  fullJsonResponse: object;
};

export interface CleanupStageData {
  prompts: {
    instructions: string;
    user: string;
  };
  rawResults: ConclaveReponseWithJson[];
  cleanedTexts: string[];
}

export interface VotingStageData {
  prompts: {
    instructions: string;
    user: string;
  };
  rawResults: ConclaveReponseWithJson[];
  totalVotes: Record<string, number>;
  selectedText: string;
}

export interface StorageData {
  config: {
    hash: string;
    raw: Config;
  };
  metadata: {
    fileCreatedAt: number;
    fileUpdatedAt: number;
    fileCreatedAtStr: string;
    fileUpdatedAtStr: string;
  };
  originalImageRelativePath: string;
  stageReached: Stage;
  ocrStage?: protos.google.cloud.documentai.v1.IProcessResponse;
  bbcodeStage?: string;
  cleanupStage?: CleanupStageData;
  votingStage?: VotingStageData;
  finalText?: string;
}

export class Storage {
  private originalFilePath: string;
  private filePath: string;
  private data: StorageData;

  constructor(originalFilePath: string) {
    this.originalFilePath = originalFilePath;
    this.filePath = this.getStoragePath(originalFilePath);
    this.data = this.initializeOrLoadData(originalFilePath);
  }

  private getStoragePath(filePath: string): string {
    const filedir = dirname(filePath);
    const filename = basename(filePath, extname(filePath));
    const hash = md5Hash(filePath);
    const storageFileName = `${filename}-${hash}-cnf${configHash}.json`;

    const fullpath = resolve(config.storage.root_dir, filedir, storageFileName);

    return fullpath;
  }

  private getStoragePathWithExtension(extension: string, suffix: string = ""): string {
    assert(this.filePath, "File path has not been set yet");
    assert(extension.startsWith("."), "Extension must start with a dot");

    const filedir = dirname(this.filePath);
    const filename = basename(this.filePath, extname(this.filePath));
    const storageFileName = `${filename}${suffix}${extension}`;

    return resolve(filedir, storageFileName);
  }

  private initializeOrLoadData(originalFilePath: string): StorageData {
    if (existsSync(this.filePath)) {
      return JSON.parse(readFileSync(this.filePath, "utf8"));
    } else {
      const now = new Date();
      const newData: StorageData = {
        stageReached: Stage.INITIALIZED,
        originalImageRelativePath: originalFilePath,
        metadata: {
          fileCreatedAt: now.getTime(),
          fileUpdatedAt: now.getTime(),
          fileCreatedAtStr: now.toISOString(),
          fileUpdatedAtStr: now.toISOString(),
        },
        config: {
          hash: configHash,
          raw: configWithoutRootDir,
        },
      };

      this.saveData(newData);

      return newData;
    }
  }

  private saveData(data: StorageData) {
    const dirName = dirname(this.filePath);

    if (!existsSync(dirName)) {
      mkdirSync(dirName, { recursive: true });
    }

    writeFileSync(this.filePath, stringifyNoIndent(data));
  }

  private updateDate() {
    const now = new Date();

    this.data.metadata.fileUpdatedAt = now.getTime();
    this.data.metadata.fileUpdatedAtStr = now.toISOString();
  }

  private updateStage(stage: Stage, stageData: any) {
    this.updateDate();

    this.data.stageReached = stage;
    (this.data[stage as keyof StorageData] as any) = stageData;
    this.saveData(this.data);
  }

  addOcrStage(
    processedDocument: protos.google.cloud.documentai.v1.IProcessResponse,
    imageData: Buffer,
  ) {
    const imageFileName = this.getStoragePathWithExtension(
      extname(this.originalFilePath),
      "-image",
    );

    for (const page of processedDocument.document!.pages!) {
      delete page.image;
      (page.image as unknown as string) = basename(imageFileName);
    }

    writeFileSync(imageFileName, imageData);

    this.updateStage(Stage.OCR, processedDocument);
  }

  addBbcodeStage(bbcodeText: string) {
    this.updateStage(Stage.BBCODE, bbcodeText);
  }

  addCleanupStage(cleanupResults: CleanupStageData) {
    this.updateStage(Stage.CLEANUP, cleanupResults);
  }

  addVotingStage(votingResults: VotingStageData) {
    this.updateStage(Stage.VOTING, votingResults);
  }

  setFinalText(finalText: string) {
    this.data.finalText = finalText;
    this.saveData(this.data);
  }

  hasReachedOrPassedStage(stage: Stage): boolean {
    return getStageIndex(this.data.stageReached) >= getStageIndex(stage);
  }

  getData(): StorageData {
    return this.data;
  }
}
