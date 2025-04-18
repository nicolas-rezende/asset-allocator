# Smart Portfolio Allocator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-646cff.svg)](https://vitest.dev/)

A command-line tool to calculate optimal asset allocation contributions based on your current portfolio, target percentages, and total contribution amount. It also simulates future portfolio evolution to reach your target allocation.

## Features

* **Optimal Contribution Calculation:** Determines the ideal contribution amount for each asset to align your portfolio with your target percentages, without selling any existing assets.
* **Single Aport Table:** Provides a clear, detailed table showing the current portfolio state, target allocation, calculated contributions, and the resulting portfolio after a single contribution.
* **Future Allocation Simulation:** Simulates multiple future contributions (up to a defined tolerance or a maximum number of iterations) and displays the evolution of asset percentages over time.
* **Configuration via JSON:** Input parameters like asset labels, current holdings, target percentages, and contribution amount are read from a separate `config.json` file for easy modification without altering the code.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```
    *(Replace `<repository_url>` and `<repository_name>` with your actual repository details)*

2.  **Install dependencies using pnpm:**
    ```bash
    pnpm install
    ```

3.  **Create a `config.json` file** in the root directory of the project (if it doesn't exist) and populate it with your asset allocation details. See the example below for the structure:

    ```json
    {
      "assetLabels": ["Asset A", "Asset B", "Asset C"],
      "assets": [10000, 20000, 5000],
      "percentages": [0.4, 0.4, 0.2],
      "totalContribution": 2000,
      "simulationTolerance": 0.5
    }
    ```

    * `assetLabels`: An array of asset names.
    * `assets`: An array of the current value for each asset.
    * `percentages`: An array of the target percentage (as a decimal between 0 and 1) for each asset.
    * `totalContribution`: The total amount you plan to contribute.
    * `simulationTolerance`: (Optional) The percentage tolerance for reaching the target allocation in the simulation. Defaults to `0.5`.

## Usage

1.  **Run the application:**
    ```bash
    pnpm start
    ```

    This command will:
    * Read the configuration from `config.json`.
    * Display a table with the optimal contribution for the next aporte.
    * Simulate future aportes until the portfolio reaches the target allocation within the specified tolerance.

## Running Tests

To execute the unit tests and ensure the core logic is working correctly, run:

```bash
pnpm test
