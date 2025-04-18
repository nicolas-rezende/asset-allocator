import { describe, it, expect } from "vitest";
import {
  calculateOptimalContributions,
  AllocationInput,
} from "../src/allocation-calculator";

describe("calculateOptimalContributions", () => {
  it("should calculate correct contributions for a simple case", () => {
    const input: AllocationInput = {
      assetLabels: ["A", "B"],
      assets: [100, 100],
      percentages: [0.6, 0.4],
      totalContribution: 100,
    };
    const result = calculateOptimalContributions(input);
    expect(result.contributions).toEqual([80, 20]);
    expect(result.updatedAssets).toEqual([180, 120]);
    expect(result.proportions).toEqual([60, 40]);
  });

  it("should handle zero total contribution", () => {
    const input: AllocationInput = {
      assetLabels: ["A", "B"],
      assets: [100, 100],
      percentages: [0.6, 0.4],
      totalContribution: 0,
    };
    const result = calculateOptimalContributions(input);
    expect(result.contributions).toEqual([0, 0]);
    expect(result.updatedAssets).toEqual([100, 100]);
    expect(result.proportions).toEqual([50, 50]);
  });

  it("should handle cases where assets are already at target proportions", () => {
    const input: AllocationInput = {
      assetLabels: ["A", "B"],
      assets: [60, 40],
      percentages: [0.6, 0.4],
      totalContribution: 50,
    };
    const result = calculateOptimalContributions(input);
    expect(result.contributions).toEqual([30, 20]);
    expect(result.updatedAssets).toEqual([90, 60]);
    expect(result.proportions).toEqual([60, 40]);
  });

  it("should handle different numbers of assets", () => {
    const input: AllocationInput = {
      assetLabels: ["A", "B", "C"],
      assets: [50, 50, 50],
      percentages: [0.3, 0.3, 0.4],
      totalContribution: 90,
    };
    const result = calculateOptimalContributions(input);
    expect(result.contributions).toEqual([22, 22, 46]);
    expect(result.updatedAssets).toEqual([72, 72, 96]);
    expect(result.proportions).toEqual([30, 30, 40]);
  });

  it("should throw error for inconsistent array lengths", () => {
    const input: AllocationInput = {
      assetLabels: ["A", "B"],
      assets: [100],
      percentages: [0.6, 0.4],
      totalContribution: 100,
    } as any; // Forçar o erro de tipo para o teste
    expect(() => calculateOptimalContributions(input)).toThrowError(
      "Os arrays de labels, ativos e percentuais devem ter o mesmo comprimento."
    );
  });

  it("should throw error for negative assets or invalid percentages", () => {
    const negativeAssetInput: AllocationInput = {
      assetLabels: ["A"],
      assets: [-10],
      percentages: [1],
      totalContribution: 10,
    };
    expect(() =>
      calculateOptimalContributions(negativeAssetInput)
    ).toThrowError(
      "Os ativos devem ser não negativos e os percentuais devem estar entre 0 e 1."
    );

    const invalidPercentageInput: AllocationInput = {
      assetLabels: ["A"],
      assets: [10],
      percentages: [1.1],
      totalContribution: 10,
    };
    expect(() =>
      calculateOptimalContributions(invalidPercentageInput)
    ).toThrowError(
      "Os ativos devem ser não negativos e os percentuais devem estar entre 0 e 1."
    );
  });
});
