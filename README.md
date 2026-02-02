# Household Budget

Electron desktop app for managing a household budget: define categories and monthly limits, import expense CSVs, categorize or ignore transactions, and view monthly charts. All data is stored locally as JSON and CSV (no database).

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Then run the app from `out/` (e.g. `electron .` from the project root, or package with electron-builder if desired).

## Features

- **Budget** — Add categories and monthly limits; saved to `config.json` in the app data folder.
- **Expenses** — Import CSV (same format as your bank export: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit). Categorize or ignore rows. Data is stored **per month** as `expenses/YYYY-MM.csv`. An existing single `expenses.csv` is migrated into month files on first run.
- **Settings** — Add rules (match description or bank category → budget category or ignore). Open data folder to see `config.json`, `rules.json`, and expense files.
- **Dashboard** — This month total, spending by category vs limits, and charts (by category and by month).

Data directory: `userData/household-budget` (e.g. on macOS: `~/Library/Application Support/household-budget`). Expenses live under `expenses/YYYY-MM.csv`; the Dashboard loads all months for charts and totals.
