import yahooFinance from "yahoo-finance2";

yahooFinance.suppressNotices(["yahooSurvey"]);

export async function fetchSharePrice(
  symbol: string
): Promise<number | undefined> {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["price"],
    });
    return result?.price?.regularMarketPrice;
  } catch (error) {
    console.error(`Failed to fetch share price for ${symbol}`, error);
    return undefined;
  }
}
