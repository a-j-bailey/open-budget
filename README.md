# Household Budget

React Native (Expo) app for managing a household budget across iPhone, iPad, and macOS (Designed for iPad / Mac Catalyst). Define categories and monthly limits, import expense CSVs, categorize transactions with rules, and view responsive interactive charts.

## Tech stack

- **Expo SDK 55 (beta) + React Native 0.83 + Expo Router** — app runtime and navigation
- **NativeWind (Tailwind)** — styling
- **react-native-gifted-charts** — interactive pie/bar/line charts
- **expo-sqlite** — local data storage
- **react-native-cloud-store (CloudKit)** — iCloud sync
- **expo-document-picker + expo-file-system** — CSV import and migration
- **PapaParse** — CSV parsing
- **Lucide React Native** — icons
- **TypeScript** — static typing

## Features

- **Budget** — add/edit/remove debit and credit categories with monthly limits or expected amounts.
- **Expenses** — import CSV, add manual transactions, categorize, ignore, and delete.
- **Rules** — auto-categorization by description or bank category (supports simple pattern and regex-like syntax).
- **Dashboard** — monthly totals + interactive charts for category spending and trends.
- **Sync** — local SQLite first, optional iCloud push/pull.
- **Migration** — one-time import from old `config.json`, `rules.json`, and monthly `*.csv` files.

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `npm start` | Start Expo dev server |
| `ios` | `npm run ios` | Run native iOS build in simulator |
| `ios:device` | `npm run ios:device` | Run native iOS build on connected device |
| `build:dev` | `npm run build:dev` | EAS development build (internal simulator profile) |
| `build:preview` | `npm run build:preview` | EAS preview/internal build |
| `build:prod` | `npm run build:prod` | EAS production build for App Store |
| `lint` | `npm run lint` | Expo lint checks |

## Development

### Prerequisites

- Node.js 18+
- Xcode + iOS Simulator
- Apple Developer account (required for iCloud-capable production builds)
- Expo account (for EAS Build)

### Run locally

```bash
npm install
npm start
```

Then press `i` in the Expo terminal, or run:

```bash
npm run ios
```

## Production builds (EAS)

```bash
npm run build:preview
npm run build:prod
```

Use `eas submit` for App Store submission after production builds.

## iPad + macOS (Catalyst / Designed for iPad)

- `app.json` has iPad support enabled (`supportsTablet: true`, orientation config).
- In Xcode/Apple Developer settings, enable "Mac (Designed for iPad)" to allow running the iPad build on macOS.

## iCloud sync setup

- Ensure iCloud entitlements in `app.json` match your Apple container:
  - `iCloud.com.magicmirrorcreative.householdbudget`
- Enable iCloud + Cloud Documents for the app ID in Apple Developer portal.
- Use **Settings -> iCloud Sync** in app to push/pull snapshots.

## Data migration (from Electron version)

1. Open the `Migrate` screen (`/migrate` route).
2. Select one or more files from your old data export:
   - `config.json`
   - `rules.json`
   - monthly expense CSV files
3. Run migration. Data is imported into SQLite and marked complete.

## Data storage

- **Primary storage**: local SQLite database (`household-budget.db`) via `expo-sqlite`.
- **Sync model**: local-first with optional iCloud snapshot push/pull.

## App icon

- Source icon: `resources/icon.png`
- Expo uses this for iOS app icon generation during build.
