import { expect, test, describe, vi } from "vitest";
import {
  calculateOptimalContributions,
  type CalculateOptimalContributionsInput,
} from "./allocation-calculator";

// Replace the actual fetchSharePrice with the mock
vi.mock("./fetch-share-price", () => ({
  fetchSharePrice: async (symbol: string) => {
    switch (symbol) {
      case "WRLD11.SA":
        return 115.0;
      case "B5P211.SA":
        return 95.0;
      case "BBFO11.SA":
        return 60.0;
      default:
        return undefined;
    }
  },
}));

describe("calculateOptimalContributions", () => {
  test("should calculate optimal contributions for a mix of value and shares", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 5000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 100,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);

    expect(result).toHaveLength(2);

    // WRLD11
    const wrld11Result = result.find((r) => r.name === "WRLD11");
    expect(wrld11Result).toBeDefined();
    expect(wrld11Result?.valueBefore).toBeCloseTo(11500);
    expect(wrld11Result?.valueAfter).toBeCloseTo(11500);
    expect(wrld11Result?.targetPercentage).toBeCloseTo(0.5);
    expect(wrld11Result?.percentageBefore).toBeCloseTo(0.92);
    expect(wrld11Result?.percentageAfter).toBeCloseTo(0.6571428571428571);
    expect(wrld11Result?.toInvest).toBeCloseTo(0);
    expect(wrld11Result?.sharePrice).toBeCloseTo(115);
    expect(wrld11Result?.numberOfSharesToBuy).toBeCloseTo(0);
    expect(wrld11Result?.investedAmount).toBeCloseTo(0);
    expect(wrld11Result?.remainder).toBeCloseTo(0);

    // CASH
    const cashResult = result.find((r) => r.name === "CASH");
    expect(cashResult).toBeDefined();
    expect(cashResult?.valueBefore).toBeCloseTo(1000);
    expect(cashResult?.valueAfter).toBeCloseTo(6000);
    expect(cashResult?.targetPercentage).toBeCloseTo(0.5);
    expect(cashResult?.percentageBefore).toBeCloseTo(0.08);
    expect(cashResult?.percentageAfter).toBeCloseTo(0.34285714285714286);
    expect(cashResult?.toInvest).toBeCloseTo(5000);
    expect(cashResult?.sharePrice).toBeUndefined();
    expect(cashResult?.numberOfSharesToBuy).toBeUndefined();
    expect(cashResult?.investedAmount).toBeCloseTo(5000);
    expect(cashResult?.remainder).toBeCloseTo(0);
  });

  test("should handle cases where no contribution is needed", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 100,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 1000,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 100000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);

    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(0); // WRLD11
    expect(result[1].toInvest).toBeCloseTo(100); // CASH
  });

  test("should handle cases with only value assets", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 2000,
      assets: [
        {
          type: "value",
          name: "FUND1",
          currentValue: 5000,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "FUND2",
          currentValue: 5000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);

    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(1000);
    expect(result[0].valueAfter).toBeCloseTo(6000);
    expect(result[1].toInvest).toBeCloseTo(1000);
    expect(result[1].valueAfter).toBeCloseTo(6000);
  });

  test("should handle cases with only share assets", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 1000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 5,
          targetPercentage: 0.5,
        },
        {
          type: "shares",
          name: "B5P211",
          symbol: "B5P211.SA",
          shares: 5,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    // WRLD11
    expect(result[0].toInvest).toBeCloseTo(450);
    expect(result[0].sharePrice).toBe(115.0);
    expect(result[0].numberOfSharesToBuy).toBe(3);
    expect(result[0].investedAmount).toBeCloseTo(345.0);
    expect(result[0].remainder).toBeCloseTo(105.0);
    expect(result[0].valueAfter).toBeCloseTo(920);

    // B5P211
    expect(result[1].toInvest).toBeCloseTo(550);
    expect(result[1].sharePrice).toBe(95.0);
    expect(result[1].numberOfSharesToBuy).toBe(5);
    expect(result[1].investedAmount).toBeCloseTo(475.0);
    expect(result[1].remainder).toBeCloseTo(75.0);
    expect(result[1].valueAfter).toBeCloseTo(950);
  });

  test("should throw error if percentages do not sum to 1", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 1000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 5,
          targetPercentage: 0.6,
        },
        {
          type: "shares",
          name: "B5P211",
          symbol: "B5P211.SA",
          shares: 5,
          targetPercentage: 0.6,
        },
      ],
    };

    await expect(calculateOptimalContributions(input)).rejects.toThrowError(
      "The percentages must sum to 1"
    );
  });

  test("should handle zero total contribution", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 0,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 100,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);

    expect(result).toHaveLength(2);
    expect(result[0].toInvest).toBeCloseTo(0);
    expect(result[1].toInvest).toBeCloseTo(0);
    expect(result[0].valueAfter).toBeCloseTo(11500);
    expect(result[1].valueAfter).toBeCloseTo(1000);
  });

  test("should use provided sharePrice in input (for simulation)", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 1000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 5,
          targetPercentage: 0.5,
          sharePrice: 120.0,
        },
        {
          type: "shares",
          name: "B5P211",
          symbol: "B5P211.SA",
          shares: 5,
          targetPercentage: 0.5,
          sharePrice: 100.0,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);

    expect(result).toHaveLength(2);

    // WRLD11 - should use provided price 120.00
    expect(result[0].sharePrice).toBe(120.0);
    expect(result[0].toInvest).toBeCloseTo(450); // Correção
    expect(result[0].numberOfSharesToBuy).toBe(3); // Correção
    expect(result[0].investedAmount).toBeCloseTo(360.0); // Correção
    expect(result[0].remainder).toBeCloseTo(90.0); // Correção
    expect(result[0].valueAfter).toBeCloseTo(960); // Correção

    // B5P211 - should use provided price 100.00
    expect(result[1].sharePrice).toBe(100.0);
    expect(result[1].toInvest).toBeCloseTo(550); // Correção
    expect(result[1].numberOfSharesToBuy).toBe(5); // Correção
    expect(result[1].investedAmount).toBeCloseTo(500.0); // Correção
    expect(result[1].remainder).toBeCloseTo(50.0); // Correção
    expect(result[1].valueAfter).toBeCloseTo(1000); // Correção
  });

  test("should handle a larger number of assets with varying types and targets", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 10000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 50,
          targetPercentage: 0.3,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 20000,
          targetPercentage: 0.4,
        },
        {
          type: "shares",
          name: "B5P211",
          symbol: "B5P211.SA",
          shares: 100,
          targetPercentage: 0.3,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(3);

    // WRLD11
    expect(result[0].toInvest).toBeCloseTo(6575.63);
    expect(result[0].valueAfter).toBeCloseTo(12305); // Ajustado para o valor real após compra de ações inteiras

    // CASH
    expect(result[1].toInvest).toBeCloseTo(0);
    expect(result[1].valueAfter).toBeCloseTo(20000);

    // B5P211
    expect(result[2].toInvest).toBeCloseTo(3424.37);
    expect(result[2].valueAfter).toBeCloseTo(12920); // Ajustado para o valor real após compra de ações inteiras
  });

  test("should handle cases where some assets are already at or above their target", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 2000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 200,
          targetPercentage: 0.3,
        }, // Acima do alvo
        {
          type: "value",
          name: "CASH",
          currentValue: 5000,
          targetPercentage: 0.7,
        }, // Abaixo do alvo
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(0);
    expect(result[1].toInvest).toBeCloseTo(2000);
  });

  test("should handle a very small total contribution", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 10,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 10,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(0);
    expect(result[1].toInvest).toBeCloseTo(10);
  });

  test("should handle a scenario requiring selling (no contribution, but imbalance)", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 0,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 200,
          targetPercentage: 0.3,
        }, // Acima
        {
          type: "value",
          name: "CASH",
          currentValue: 5000,
          targetPercentage: 0.7,
        }, // Abaixo
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(0);
    expect(result[1].toInvest).toBeCloseTo(0);
    expect(result[0].valueAfter).toBeCloseTo(23000);
    expect(result[1].valueAfter).toBeCloseTo(5000);
  });

  test("should handle assets with target percentage zero", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 1000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 10,
          targetPercentage: 1,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 0,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(1000);
    expect(result[1].toInvest).toBeCloseTo(0);
  });

  test("should handle a scenario where total contribution is exactly enough to reach targets without fractional shares", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 90,
      assets: [
        {
          type: "shares",
          name: "B5P211",
          symbol: "B5P211.SA",
          shares: 10,
          targetPercentage: 0.5,
        }, // Valor inicial 950, alvo com aporte 1000
        {
          type: "value",
          name: "CASH",
          currentValue: 1050,
          targetPercentage: 0.5,
        }, // Valor inicial 1050, alvo com aporte 1000
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(90);
    expect(result[0].numberOfSharesToBuy).toBe(0);
    expect(result[0].investedAmount).toBeCloseTo(0);
    expect(result[1].toInvest).toBeCloseTo(0);
  });

  test("should handle a scenario with only one asset (shares)", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 500,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 10,
          targetPercentage: 1,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(1);

    expect(result[0].toInvest).toBeCloseTo(500);
    expect(result[0].numberOfSharesToBuy).toBe(4);
    expect(result[0].investedAmount).toBeCloseTo(460);
  });

  test("should handle a scenario with only one asset (value)", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 500,
      assets: [
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 1,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(1);

    expect(result[0].toInvest).toBeCloseTo(500);
    expect(result[0].valueAfter).toBeCloseTo(1500);
  });

  test("should handle initial portfolio with zero value for some assets", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 200,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 0,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 100,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(150);
    expect(result[0].numberOfSharesToBuy).toBe(1);
    expect(result[1].toInvest).toBeCloseTo(50);
  });

  test("should handle a large total contribution relative to the portfolio size", async () => {
    const input: CalculateOptimalContributionsInput = {
      totalContribution: 100000,
      assets: [
        {
          type: "shares",
          name: "WRLD11",
          symbol: "WRLD11.SA",
          shares: 10,
          targetPercentage: 0.5,
        },
        {
          type: "value",
          name: "CASH",
          currentValue: 1000,
          targetPercentage: 0.5,
        },
      ],
    };

    const result = await calculateOptimalContributions(input);
    expect(result).toHaveLength(2);

    expect(result[0].toInvest).toBeCloseTo(49925);
    expect(result[1].toInvest).toBeCloseTo(50075);
  });
});
