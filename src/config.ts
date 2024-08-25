import YAML from "yaml";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { md5Hash } from "./md5";

export type ConclaveMemberType = "claude" | "gemini" | "gpt";

export interface ConclaveMemberConfig {
  type: ConclaveMemberType;
  name: string;
  model: string;
  apiKeyEnv: string;
  options: Record<string, unknown>;
}

interface StagesSettings {
  vars: Record<string, string>;
  textCleanup: {
    systemInstructions: string;
  };
  voting: {
    systemInstructions: string;
  };
}

export interface Config {
  input: {
    root: string;
    glob: string;
  };
  output: {
    local_file: string;
  };
  cache: {
    root_dir: string;
  };
  storage: {
    root_dir: string;
  };
  stagesSettings: StagesSettings;
  conclave: ConclaveMemberConfig[];
}

const ROOT_DIR = resolve(__dirname, "..").replaceAll("\\", "/");

const configFilePath = resolve(__dirname, "../config.yml");
const rawConfig = readFileSync(configFilePath, "utf8");
const rawConfigWithRootDir = rawConfig.replaceAll("{{ROOT_DIR}}", ROOT_DIR);
const config: Config = YAML.parse(rawConfigWithRootDir);

const configWithoutRootDir = YAML.parse(rawConfig);
const configHash = md5Hash(JSON.stringify(configWithoutRootDir));

export { configHash, configWithoutRootDir, ROOT_DIR };

export default config;
