import chalk from "chalk";
import Table from "cli-table3";
import type {
  CalculateOptimalContributionsInput,
  CalculateOptimalContributionsOutput,
} from "./allocation-calculator";
import { calculateOptimalContributions } from "./allocation-calculator";

export async function displaySingleAllocation(
  input: CalculateOptimalContributionsInput
) {
  const { assets, totalContribution } = input;

  const result: CalculateOptimalContributionsOutput =
    await calculateOptimalContributions(input);

  console.log(
    chalk.bold.blue("\n--- Allocation Calculation for Next Contribution ---")
  );
  const table = new Table({
    head: [
      chalk.yellow("Asset"),
      chalk.blue("Current Value"),
      chalk.blue("Current Prop."),
      chalk.green("Target Prop."),
      chalk.cyan("To Invest"),
      chalk.cyan("Invested"),
      chalk.cyan("Remainder"),
      chalk.magenta("Value After"),
      chalk.magenta("Prop. After"),
      chalk.gray("Price"),
      chalk.gray("Buy Qty"),
    ],
  });

  for (const assetResult of result) {
    table.push([
      assetResult.name,
      assetResult.valueBefore.toFixed(2),
      getPercentageString(assetResult.percentageBefore),
      getPercentageString(assetResult.targetPercentage),
      assetResult.toInvest.toFixed(2),
      assetResult.investedAmount !== undefined
        ? assetResult.investedAmount.toFixed(2)
        : "N/A",
      assetResult.remainder !== undefined
        ? assetResult.remainder.toFixed(2)
        : "N/A",
      assetResult.valueAfter.toFixed(2),
      getPercentageString(assetResult.percentageAfter),
      assetResult.sharePrice !== undefined
        ? assetResult.sharePrice.toFixed(2)
        : "N/A",
      assetResult.numberOfSharesToBuy !== undefined
        ? assetResult.numberOfSharesToBuy.toFixed(0)
        : "N/A",
    ]);
  }

  // Cálculo dos totais (opcional)
  const totalBefore = result.reduce((sum, asset) => sum + asset.valueBefore, 0);
  const totalInvested = result.reduce(
    (sum, asset) =>
      sum + (asset.investedAmount !== undefined ? asset.investedAmount : 0),
    0
  );
  const totalAfter = result.reduce((sum, asset) => sum + asset.valueAfter, 0);

  const totalRow = [
    chalk.bold("Total"),
    chalk.bold(totalBefore.toFixed(2)),
    "",
    "",
    chalk.bold(totalContribution.toFixed(2)),
    chalk.bold(totalInvested.toFixed(2)),
    chalk.bold((totalContribution - totalInvested).toFixed(2)), // Total Remainder
    chalk.bold(totalAfter.toFixed(2)),
    "",
    "",
    "",
  ];
  table.push(totalRow);

  console.log(table.toString());
  return result;
}

function getPercentageString(percentage: number): string {
  return `${(percentage * 100).toFixed(2)}%`;
}

export async function simulateUntilTarget(
  initialInput: CalculateOptimalContributionsInput,
  tolerance = 0.5
): Promise<void> {
  console.log(
    chalk.bold.blue(
      `\n--- Simulation until Target Allocation (Tolerance: ${tolerance}%) ---`
    )
  );

  const futureTable = new Table({
    head: [
      chalk.yellow("Iteration"),
      ...initialInput.assets.map((asset) => chalk.blue(`% ${asset.name}`)),
    ],
  });

  let currentAssets = [...initialInput.assets];
  let iteration = 0;

  while (true) {
    iteration++;

    const result: CalculateOptimalContributionsOutput =
      await calculateOptimalContributions({
        assets: currentAssets,
        totalContribution: initialInput.totalContribution,
      });

    const proportions = result.map((r) => r.percentageAfter);
    const row = [
      chalk.green(`${iteration}`),
      ...proportions.map((p) => `${(p * 100).toFixed(2)}%`),
    ];

    futureTable.push(row);

    // Update currentAssets for the next iteration
    currentAssets = currentAssets.map((asset, index) => {
      if (asset.type === "shares") {
        const matchingResult = result.find((res) => res.name === asset.name);
        if (
          !matchingResult ||
          matchingResult.numberOfSharesToBuy === undefined
        ) {
          throw new Error("Unexpected error: numberOfSharesToBuy is undefined");
        }

        return {
          ...asset,
          shares: asset.shares + matchingResult.numberOfSharesToBuy,
        };
      }

      return {
        ...asset,
        currentValue: result[index].valueAfter,
      };
    });

    const withinTolerance = currentAssets.every((asset, index) => {
      const currentProportion = proportions[index] * 100;
      const targetProportion = asset.targetPercentage * 100;
      return Math.abs(currentProportion - targetProportion) <= tolerance;
    });

    if (withinTolerance || iteration >= 1000) {
      break;
    }
  }

  console.log(futureTable.toString());
}
