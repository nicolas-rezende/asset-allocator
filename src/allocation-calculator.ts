import { fetchSharePrice } from "./fetch-share-price";

interface Asset {
  name: string;
  targetPercentage: number;
}

interface AssetWithValue extends Asset {
  type: "value";
  currentValue: number;
}

interface AssetWithShares extends Asset {
  type: "shares";
  symbol: string;
  shares: number;
  sharePrice?: number; // Adicionado para a simulação
}

export interface CalculateOptimalContributionsInput {
  assets: Array<AssetWithShares | AssetWithValue>;
  totalContribution: number;
}

export type CalculateOptimalContributionsOutput = Array<{
  name: string;
  valueBefore: number;
  valueAfter: number;
  targetPercentage: number;
  percentageBefore: number;
  percentageAfter: number;
  toInvest: number;
  sharePrice?: number;
  numberOfSharesToBuy?: number;
  investedAmount?: number;
  remainder?: number;
}>;

export async function calculateOptimalContributions({
  assets,
  totalContribution,
}: CalculateOptimalContributionsInput): Promise<CalculateOptimalContributionsOutput> {
  const percentages = assets.map((asset) => asset.targetPercentage);
  throwIfPercentagesInvalid(percentages);

  // Fetch share prices from Yahoo Finance
  const sharePrices = await fetchSharePrices(assets);

  const currentAssetValues = assets.map((a) => {
    if (a.type === "value") {
      return a.currentValue;
    }

    if (a.type === "shares") {
      return sharePrices[a.symbol] * a.shares;
    }

    return 0;
  });

  const currentTotalValue = currentAssetValues.reduce(
    (acc, val) => acc + val,
    0
  );
  const finalTotalValue = currentTotalValue + totalContribution;

  const idealValues = percentages.map(
    (percentage) => finalTotalValue * percentage
  );

  const differences = currentAssetValues.map((currentValue, index) =>
    Math.max(0, idealValues[index] - currentValue)
  );

  const totalDifference = differences.reduce((acc, val) => acc + val, 0);

  const proportions = differences.map((difference) =>
    totalDifference === 0 ? 0 : difference / totalDifference
  );

  return assets.map((asset, index) => {
    const toInvest = totalContribution * proportions[index];
    let investedAmount = toInvest;
    let remainder = 0;
    let numberOfSharesToBuy: number | undefined;
    let sharePrice: number | undefined;

    if (asset.type === "shares" && sharePrices[asset.symbol] !== undefined) {
      sharePrice = sharePrices[asset.symbol];
      const possibleShares = Math.floor(toInvest / sharePrice);
      numberOfSharesToBuy = possibleShares;
      investedAmount = possibleShares * sharePrice;
      remainder = toInvest - investedAmount;
    }

    const valueAfter = currentAssetValues[index] + investedAmount;
    const finalTotalValueActual =
      currentTotalValue +
      (totalContribution -
        Object.values(
          getRemainders(assets, totalContribution, proportions, sharePrices)
        ).reduce((sum, val) => sum + val, 0));
    const percentageAfter =
      finalTotalValueActual === 0 ? 0 : valueAfter / finalTotalValueActual;

    return {
      name: asset.name,
      valueBefore: currentAssetValues[index],
      valueAfter,
      targetPercentage: asset.targetPercentage,
      percentageBefore: currentAssetValues[index] / currentTotalValue,
      percentageAfter,
      toInvest,
      sharePrice,
      numberOfSharesToBuy,
      investedAmount,
      remainder,
    };
  });
}

function throwIfPercentagesInvalid(percentages: Array<number>): void {
  const tolerance = 1e-9;
  const sumOfPercentages = percentages.reduce((acc, val) => acc + val, 0);

  if (Math.abs(sumOfPercentages - 1) > tolerance) {
    throw new Error("The percentages must sum to 1");
  }
}

async function fetchSharePrices(
  assets: CalculateOptimalContributionsInput["assets"]
): Promise<Record<string, number>> {
  const fetchPromises: Record<string, Promise<number | undefined>> = {};
  const sharePrices: Record<string, number> = {};

  for (const asset of assets) {
    if (asset.type === "shares") {
      if (asset.sharePrice !== undefined) {
        sharePrices[asset.symbol] = asset.sharePrice; // Use provided price
      } else {
        fetchPromises[asset.symbol] = fetchSharePrice(asset.symbol);
      }
    }
  }

  const fetchedPricesResult = await Promise.all(Object.values(fetchPromises));
  const fetchedPrices: Record<string, number> = {};
  const symbols = Object.keys(fetchPromises);
  for (let i = 0; i < symbols.length; i++) {
    const price = fetchedPricesResult[i];
    if (!price) {
      console.warn(`Failed to fetch share price for ${symbols[i]}.`);
      fetchedPrices[symbols[i]] = 0;
    } else {
      fetchedPrices[symbols[i]] = price;
    }
  }

  return { ...sharePrices, ...fetchedPrices };
}

function getRemainders(
  assets: CalculateOptimalContributionsInput["assets"],
  totalContribution: number,
  proportions: number[],
  sharePrices: Record<string, number>
): Record<string, number> {
  const remainders: Record<string, number> = {};
  assets.forEach((asset, index) => {
    if (asset.type === "shares" && sharePrices[asset.symbol] !== undefined) {
      const toInvest = totalContribution * proportions[index];
      const sharePrice = sharePrices[asset.symbol];
      const possibleShares = Math.floor(toInvest / sharePrice);
      remainders[asset.name] = toInvest - possibleShares * sharePrice;
    } else {
      remainders[asset.name] = 0;
    }
  });
  return remainders;
}
