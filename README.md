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

| Script       | Command             | Description                                           |
| ------------ | ------------------- | ----------------------------------------------------- |
| **dev**      | `npm run dev`       | Start Electron with Vite dev server (hot reload)      |
| **build**    | `npm run build`     | Build main, preload, and renderer to `out/`           |
| **preview**  | `npm run preview`   | Preview the Vite renderer build (web only)            |
| **build:mac**| `npm run build:mac` | Build then package for macOS (DMG in `release/<version>/`) |
| **build:win**| `npm run build:win` | Build then package for Windows (NSIS installer)       |
| **build:linux**| `npm run build:linux` | Build then package for Linux (AppImage)            |
| **build:all**| `npm run build:all` | Build then package for macOS, Windows, and Linux      |

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

Run the built app from the project root with Electron (e.g. `npx electron .`).

### Installable packages (electron-builder)

To produce installers and packaged apps (e.g. macOS `.dmg`, Windows `.exe`, Linux `.AppImage`):

```bash
npm run build:mac     # release/<version>/*.dmg
npm run build:win     # release/<version>/*-setup.exe
npm run build:linux   # release/<version>/*.AppImage
npm run build:all     # all platforms
```

Output goes to **`release/<version>/`** (gitignored). Config: `electron-builder.yml`.

### Preview (renderer only)

```bash
npm run preview
```

Serves the built renderer in the browser for quick UI checks without launching Electron.

## App icon

1. Add a PNG (e.g. 256×256 or 512×512) as **`resources/icon.png`**.
2. The icon is used for the window and dock/taskbar when you run the app.

If `icon.png` is missing, Electron uses its default icon. For packaged installers, optional OS/installer icons go in **`build/`** — see **`build/README.md`** and [electron-builder](https://www.electron.build/) configuration.

## Environment variables

No env vars are required for a normal build or for unsigned installers. For **code signing and notarization** (e.g. macOS notarization, Windows Authenticode), you can set:

| Variable | Purpose |
| -------- | ------- |
| `CSC_LINK` | Path or URL to signing certificate (e.g. `.p12`) |
| `CSC_KEY_PASSWORD` | Certificate password |
| `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` | macOS notarization (with an `afterSign` script) |
| `GH_TOKEN` | Optional: for electron-builder `publish` (e.g. GitHub releases) |

See **`.env.example`** for a list of variable names (no secrets). Set these in CI or a local `.env` that is not committed.

## Data directory

- **Location:** `userData/household-budget`  
  e.g. on macOS: `~/Library/Application Support/household-budget`
- **Contents:** `config.json`, `rules.json`, and `expenses/YYYY-MM.csv`. Use **Settings → Open data folder** in the app to open this directory.
