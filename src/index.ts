import path from "node:path";
import fs from "node:fs";
import type {
  CalculateOptimalContributionsInput,
  CalculateOptimalContributionsOutput,
} from "./allocation-calculator";
import { displaySingleAllocation, simulateUntilTarget } from "./cli-output";

main();

async function main() {
  const configPath = path.join(process.cwd(), "config.json");
  const configFile = fs.readFileSync(configPath, "utf-8");
  const rawConfig: CalculateOptimalContributionsInput = JSON.parse(configFile);

  const allocationResult: CalculateOptimalContributionsOutput =
    await displaySingleAllocation(rawConfig);

  // Prepare input for simulation, using the share prices from the allocation result
  const simulationInput = {
    assets: rawConfig.assets.map((asset) => {
      if (asset.type === "shares") {
        const matchingResult = allocationResult.find(
          (res) => res.name === asset.name
        );
        return {
          ...asset,
          sharePrice: matchingResult?.sharePrice,
        };
      }
      return asset;
    }),
    totalContribution: rawConfig.totalContribution,
  };

  simulateUntilTarget(simulationInput, 0.25);
}
