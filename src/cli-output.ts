import chalk from "chalk";
import Table from "cli-table3";
import {
  calculateOptimalContributions,
  AllocationInput,
  ContributionResult,
} from "./allocation-calculator";

export function displaySingleAllocation(
  input: AllocationInput
): ContributionResult {
  const { assetLabels, assets, percentages, totalContribution } = input;

  console.log(
    chalk.bold.blue("\n--- Allocation Calculation for Next Contribution ---")
  );

  const result = calculateOptimalContributions(input);
  const currentTotalValue = assets.reduce((acc, val) => acc + val, 0);
  const finalTotalValue = currentTotalValue + totalContribution;
  const currentProportions = assets.map(
    (asset) => (asset / currentTotalValue) * 100
  );

  const table = new Table({
    head: [
      chalk.yellow("Asset"),
      chalk.blue("Current Value"),
      chalk.blue("Current Prop."),
      chalk.green("Target Prop."),
      chalk.cyan("Contribution"),
      chalk.magenta("Value After"),
      chalk.magenta("Prop. After"),
    ],
  });

  assetLabels.forEach((label, index) => {
    table.push([
      label,
      assets[index].toFixed(2),
      `${currentProportions[index].toFixed(2)}%`,
      `${(percentages[index] * 100).toFixed(2)}%`,
      result.contributions[index].toFixed(2),
      result.updatedAssets[index].toFixed(2),
      `${result.proportions[index].toFixed(2)}%`,
    ]);
  });

  const totalRow = [
    chalk.bold("Total"),
    chalk.bold(currentTotalValue.toFixed(2)),
    "",
    "",
    chalk.bold(totalContribution.toFixed(2)),
    chalk.bold(finalTotalValue.toFixed(2)),
    "",
  ];
  table.push(totalRow);

  console.log(table.toString());
  return result;
}

export function simulateUntilTarget(
  initialInput: AllocationInput,
  tolerance: number = 0.5
): void {
  console.log(
    chalk.bold.blue(
      `\n--- Simulation until Target Allocation (Tolerance: ${tolerance}%) ---`
    )
  );

  const futureTable = new Table({
    head: [
      chalk.yellow("Iteration"),
      ...initialInput.assetLabels.map((label) => chalk.blue(`% ${label}`)),
    ],
  });

  let currentAssets = [...initialInput.assets];
  const percentages = [...initialInput.percentages];
  const totalContribution = initialInput.totalContribution;
  const assetLabels = [...initialInput.assetLabels];
  let iteration = 0;
  let totalInvested = 0;

  while (true) {
    iteration++;
    totalInvested += totalContribution;
    const input: AllocationInput = {
      assetLabels: assetLabels,
      assets: currentAssets,
      percentages: percentages,
      totalContribution: totalContribution,
    };

    const result = calculateOptimalContributions(input);
    const currentTotalValue = currentAssets.reduce((acc, val) => acc + val, 0);
    const currentProportions = currentAssets.map(
      (asset) => (asset / currentTotalValue) * 100
    );

    const row = [
      chalk.green(`${iteration}`),
      ...currentProportions.map((prop) => prop.toFixed(2) + "%"),
    ];
    futureTable.push(row);
    currentAssets = result.updatedAssets;

    const withinTolerance = currentProportions.every((prop, index) => {
      const target = percentages[index] * 100;
      return Math.abs(prop - target) <= tolerance;
    });

    if (withinTolerance || iteration >= 1000) {
      break;
    }
  }

  console.log(futureTable.toString());
  console.log(
    chalk.yellow(`\nSimulation finished after ${iteration} iterations.`)
  );
  console.log(
    chalk.green.bold(
      `Total invested in simulation: R$ ${totalInvested.toFixed(2)}`
    )
  );
}
