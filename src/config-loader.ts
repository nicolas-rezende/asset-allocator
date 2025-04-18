import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AllocationInput } from "./allocation-calculator";

interface RawAssetConfig {
  name?: string;
  currentValue?: number;
  targetPercentage?: number;
}

interface RawConfig {
  assets?: RawAssetConfig[];
  totalContribution?: number;
  simulationTolerance?: number;
}

export function readConfigFile():
  | (AllocationInput & { simulationTolerance: number })
  | null {
  try {
    const configPath = path.join(process.cwd(), "config.json");
    const configFile = fs.readFileSync(configPath, "utf-8");
    const rawConfig: RawConfig = JSON.parse(configFile);

    if (
      !Array.isArray(rawConfig.assets) ||
      typeof rawConfig.totalContribution !== "number"
    ) {
      console.error(
        chalk.red.bold(
          'Error: Invalid structure in config.json. The "assets" array and "totalContribution" are required.'
        )
      );
      return null;
    }

    const assetLabels: string[] = [];
    const assets: number[] = [];
    const percentages: number[] = [];

    for (const asset of rawConfig.assets) {
      if (
        !asset?.name ||
        typeof asset.currentValue !== "number" ||
        typeof asset.targetPercentage !== "number"
      ) {
        console.error(
          chalk.red.bold(
            'Error: Each asset in the "assets" array must have "name", "currentValue", and "targetPercentage".'
          )
        );
        return null;
      }
      assetLabels.push(asset.name);
      assets.push(asset.currentValue);
      percentages.push(asset.targetPercentage);
    }

    if (assetLabels.length === 0) {
      console.error(
        chalk.red.bold(
          'Error: The "assets" array cannot be empty in config.json.'
        )
      );
      return null;
    }

    const config: AllocationInput & { simulationTolerance: number } = {
      assetLabels: assetLabels,
      assets: assets,
      percentages: percentages,
      totalContribution: rawConfig.totalContribution,
      simulationTolerance:
        rawConfig.simulationTolerance === undefined
          ? 0.5
          : rawConfig.simulationTolerance,
    };

    return config;
  } catch (error: any) {
    console.error(
      chalk.red.bold("Error reading configuration file:"),
      error.message
    );
    return null;
  }
}
