import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AllocationInput } from "./allocation-calculator";

export function readConfigFile():
  | (AllocationInput & { simulationTolerance: number })
  | null {
  try {
    const configPath = path.join(process.cwd(), "config.json");
    const configFile = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configFile);
    return {
      assetLabels: config.assetLabels,
      assets: config.assets,
      percentages: config.percentages,
      totalContribution: config.totalContribution,
      simulationTolerance: config.simulationTolerance || 0.5,
    };
  } catch (error: any) {
    console.error(
      chalk.red.bold("Error reading configuration file:"),
      error.message
    );
    return null;
  }
}
