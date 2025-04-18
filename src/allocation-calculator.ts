export interface AllocationInput {
  assetLabels: string[];
  assets: number[];
  percentages: number[];
  totalContribution: number;
}

export interface ContributionResult {
  contributions: number[];
  updatedAssets: number[];
  proportions: number[];
}

export function calculateOptimalContributions(
  input: AllocationInput
): ContributionResult {
  const { assets, percentages, totalContribution } = input;

  if (
    assets.length !== percentages.length ||
    assets.length !== input.assetLabels.length
  ) {
    throw new Error(
      "The labels, assets, and percentages arrays must have the same length."
    );
  }

  if (
    assets.some((asset) => asset < 0) ||
    percentages.some((percentage) => percentage < 0 || percentage > 1)
  ) {
    throw new Error(
      "Assets must be non-negative and percentages must be between 0 and 1."
    );
  }

  const currentTotalValue = assets.reduce((acc, val) => acc + val, 0);
  const finalTotalValue = currentTotalValue + totalContribution;

  const idealValues = percentages.map((percentage) => {
    return finalTotalValue * percentage;
  });

  const differences = assets.map((currentValue, index) => {
    let difference = idealValues[index] - currentValue;
    return Math.max(0, difference);
  });

  const totalDifference = differences.reduce((acc, val) => acc + val, 0);

  const proportions = differences.map((difference) => {
    return totalDifference === 0 ? 0 : difference / totalDifference;
  });

  const contributions = proportions.map((proportion) => {
    return totalContribution * proportion;
  });

  const updatedAssets = assets.map((asset, index) => {
    return asset + contributions[index];
  });

  const updatedProportions = updatedAssets.map((updatedAsset) => {
    return (updatedAsset / finalTotalValue) * 100;
  });

  return {
    contributions,
    updatedAssets,
    proportions: updatedProportions,
  };
}
