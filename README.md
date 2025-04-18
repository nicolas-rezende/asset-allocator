# Asset Allocation CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

A command-line tool to calculate optimal asset allocation contributions based on your current portfolio, target percentages, and total contribution amount. It also simulates future portfolio evolution to reach your target allocation.

## Features

- **Optimal Contribution Calculation:** Determines the ideal contribution amount for each asset to align your portfolio with your target percentages, without selling any existing assets.
- **Single Aport Table:** Provides a clear, detailed table showing the current portfolio state, target allocation, calculated contributions, and the resulting portfolio after a single contribution.
- **Future Allocation Simulation:** Simulates multiple future contributions (up to a defined tolerance or a maximum number of iterations) and displays the evolution of asset percentages over time.
- **Configuration via JSON:** Input parameters like asset labels, current holdings, target percentages, and contribution amount are read from a `config.json` file for easy modification without altering the code.

## Screenshot

![Example Output](screenshots/example.png)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

    _(Replace `<repository_url>` and `<repository_name>` with your actual repository details)_

2.  **Install dependencies using pnpm:**

    ```bash
    pnpm install
    ```

3.  **Configure your portfolio details:**

    - In the root directory, you will find a file named `config.example.json`.
    - **Make a copy of this file and rename it to `config.json`.**
    - Open `config.json` and replace the example data with your actual portfolio details.

    The structure of the `config.json` file is as follows:

    ```json
    {
      "assets": [
        {
          "name": "WRLD11",
          "currentValue": 57385.0,
          "targetPercentage": 0.5
        },
        {
          "name": "IPCA",
          "currentValue": 56885.07,
          "targetPercentage": 0.25
        },
        {
          "name": "SELIC",
          "currentValue": 40657.03,
          "targetPercentage": 0.2
        },
        {
          "name": "FII",
          "currentValue": 2025.87,
          "targetPercentage": 0.05
        }
      ],
      "totalContribution": 5000,
      "simulationTolerance": 0.5
    }
    ```

    - `assets`: An array of objects, where each object represents an asset in your portfolio and has the following properties:
      - `name`: The name or label of the asset (string).
      - `currentValue`: The current value you hold for this asset (number).
      - `targetPercentage`: The desired target percentage for this asset (number between 0 and 1).
    - `totalContribution`: The total amount you plan to contribute (number).
    - `simulationTolerance`: (Optional) The percentage tolerance for reaching the target allocation in the simulation (number, defaults to `0.5`).

## Usage

1.  **Run the application:**

    ```bash
    pnpm start
    ```

    This command will:

    - Read your portfolio configuration from `config.json`.
    - Display a table with the optimal contribution for the next aporte.
    - Simulate future aportes until the portfolio reaches the target allocation within the specified tolerance.

## Running Tests

To execute the unit tests, run:

```bash
pnpm test
```
