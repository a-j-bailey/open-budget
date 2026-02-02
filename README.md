# Household Budget

Electron desktop app for managing a household budget: define categories and monthly limits, import expense CSVs, categorize or ignore transactions, and view monthly charts. All data is stored locally as JSON and CSV (no database, no cloud).

## Tech stack

- **Electron** + **electron-vite** — main, preload, and renderer build
- **React 18** + **React Router** — UI and navigation
- **Tailwind CSS** — styling
- **Recharts** — dashboard charts
- **PapaParse** — CSV import/export
- **Lucide React** — icons
- **TypeScript** — across main, preload, and renderer

## Features

- **Budget** — Add budget categories and monthly limits. Stored in `config.json` in the app data folder.
- **Expenses** — Import CSV (bank-export style: Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit). Categorize or ignore rows. Data is stored **per month** as `expenses/YYYY-MM.csv`. An existing single `expenses.csv` is migrated into month files on first run.
- **Settings** — Define rules (match description or bank category → budget category or ignore). Open data folder to inspect `config.json`, `rules.json`, and expense files.
- **Dashboard** — This month total, spending by category vs limits, and charts (by category and by month).

## Scripts

| Script     | Command           | Description                                      |
| ---------- | ----------------- | ------------------------------------------------ |
| **dev**    | `npm run dev`     | Start Electron with Vite dev server (hot reload) |
| **build**  | `npm run build`   | Build main, preload, and renderer to `out/`      |
| **preview**| `npm run preview` | Preview the Vite renderer build (web only)      |

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

Run the built app from the project root with Electron (e.g. `npx electron .`), or package with [electron-builder](https://www.electron.build/) if you want installers.

### Preview (renderer only)

```bash
npm run preview
```

Serves the built renderer in the browser for quick UI checks without launching Electron.

## App icon

1. Add a PNG (e.g. 256×256 or 512×512) as **`resources/icon.png`**.
2. The icon is used for the window and dock/taskbar when you run the app.

If `icon.png` is missing, Electron uses its default icon. For packaged installers (macOS `.app`, Windows `.exe`), see **`resources/README.md`** and [electron-builder](https://www.electron.build/) icon config.

## Data directory

- **Location:** `userData/household-budget`  
  e.g. on macOS: `~/Library/Application Support/household-budget`
- **Contents:** `config.json`, `rules.json`, and `expenses/YYYY-MM.csv`. Use **Settings → Open data folder** in the app to open this directory.
