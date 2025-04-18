import { describe, it, expect, vi } from "vitest";
import {
  calculateOptimalContributions,
  AllocationInput,
} from "../src/allocation-calculator";
import { readConfigFile } from "../src/config-loader";
import * as fs from "fs";

// Mocking the fs module for config-loader tests
vi.mock("fs");

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
      "The labels, assets, and percentages arrays must have the same length."
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
      "Assets must be non-negative and percentages must be between 0 and 1."
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
      "Assets must be non-negative and percentages must be between 0 and 1."
    );
  });
});

describe("readConfigFile", () => {
  it("should return null and log an error if config.json is not found", () => {
    (fs.readFileSync as any).mockImplementation(() => {
      throw new Error("ENOENT: no such file or directory");
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error reading configuration file:",
      "ENOENT: no such file or directory"
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return null and log an error if config.json has invalid JSON", () => {
    (fs.readFileSync as any).mockImplementation(() => '{ "assets": ');
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error reading configuration file:",
      "Unexpected end of JSON input"
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return null and log an error if required fields are missing", () => {
    (fs.readFileSync as any).mockImplementation(() =>
      JSON.stringify({ assets: [] })
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Invalid structure in config.json. The "assets" array and "totalContribution" are required.'
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return null and log an error if asset objects are missing required properties", () => {
    (fs.readFileSync as any).mockImplementation(() =>
      JSON.stringify({ assets: [{ name: "A" }], totalContribution: 100 })
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Each asset in the "assets" array must have "name", "currentValue", and "targetPercentage".'
    );

    consoleErrorSpy.mockRestore();
  });

  it("should successfully parse a valid config.json", () => {
    const mockConfig = {
      assets: [
        { name: "A", currentValue: 100, targetPercentage: 0.5 },
        { name: "B", currentValue: 100, targetPercentage: 0.5 },
      ],
      totalContribution: 50,
      simulationTolerance: 0.2,
    };
    (fs.readFileSync as any).mockImplementation(() =>
      JSON.stringify(mockConfig)
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toEqual({
      assetLabels: ["A", "B"],
      assets: [100, 100],
      percentages: [0.5, 0.5],
      totalContribution: 50,
      simulationTolerance: 0.2,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should use default simulationTolerance if not provided", () => {
    const mockConfig = {
      assets: [
        { name: "A", currentValue: 100, targetPercentage: 0.5 },
        { name: "B", currentValue: 100, targetPercentage: 0.5 },
      ],
      totalContribution: 50,
    };
    (fs.readFileSync as any).mockImplementation(() =>
      JSON.stringify(mockConfig)
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const config = readConfigFile();

    expect(config).toEqual({
      assetLabels: ["A", "B"],
      assets: [100, 100],
      percentages: [0.5, 0.5],
      totalContribution: 50,
      simulationTolerance: 0.5, // Default value
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
