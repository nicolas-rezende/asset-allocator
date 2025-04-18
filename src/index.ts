import { readConfigFile } from "./config-loader";
import { displaySingleAllocation, simulateUntilTarget } from "./cli-output";
import { AllocationInput } from "./allocation-calculator";

const config = readConfigFile();

if (config) {
  const firstAllocationResult = displaySingleAllocation(config);

  const futureAllocationInput: AllocationInput = {
    assetLabels: config.assetLabels,
    assets: firstAllocationResult.updatedAssets,
    percentages: config.percentages,
    totalContribution: config.totalContribution,
  };

  simulateUntilTarget(futureAllocationInput, config.simulationTolerance);
}
