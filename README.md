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

## Feedback

Submit feedback and feature requests at [OpenBudget on UserJot](https://openbudget.userjot.com/?cursor=1&order=top&limit=10).

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

## Configure iCloud sync

The app uses **iCloud Documents** (via `react-native-cloud-store`) to push/pull a single JSON snapshot of categories, rules, and expenses. No env vars are required; everything is driven by Apple’s iCloud entitlements and your App ID.

### 1. Apple Developer Portal

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Select your **App ID** (e.g. `com.magicmirrorcreative.householdbudget`). If you don’t have one, create an **App ID** and enable **iCloud** in Capabilities.
3. With **iCloud** enabled, under **iCloud**, check **Cloud Documents** (or **iCloud Documents**).
4. Under **iCloud Containers**, add or select a container. The project is set up to use:
   - **Container ID**: `iCloud.com.magicmirrorcreative.householdbudget`
   - You can create this container via the **+** next to “iCloud Containers” if it doesn’t exist.
5. Save the identifier.

### 2. App configuration (`app.json`)

The repo is already configured for that container. In `app.json` → `expo.ios.entitlements` you should see:

- `com.apple.developer.icloud-container-identifiers`: `["iCloud.com.magicmirrorcreative.householdbudget"]`
- `com.apple.developer.icloud-services`: `["CloudDocuments"]`
- `com.apple.developer.ubiquity-container-identifiers`: `["iCloud.com.magicmirrorcreative.householdbudget"]`

If you use a **different** team or container, create a new iCloud container in the Developer portal and replace `iCloud.com.magicmirrorcreative.householdbudget` with your container ID in those three places. The app uses the **first** iCloud container in the entitlements as the default.

### 3. Build and run

- **Local device**: `npm run ios:device` (or `npx expo run:ios --device`) — Xcode will use the entitlements from the Expo-generated project.
- **EAS**: `npm run build:dev` / `build:preview` / `build:prod` — EAS merges `app.json` entitlements into the native project.

If iCloud doesn’t work after a build, open the project in Xcode (`ios/` after a prebuild, or the project Expo opens), select the app target → **Signing & Capabilities** and confirm **iCloud** is present and your container is checked.

### 4. On the device

- The device must be signed into **iCloud** (Settings → [your name]).
- **Settings → [your name] → iCloud → iCloud Drive** should be on; optionally ensure the app is allowed if you’ve restricted iCloud Drive by app.

### 5. In the app

- Open **Settings** (tab) → **iCloud Sync**.
- **Push to iCloud** — uploads the current snapshot (categories, rules, expenses) to iCloud.
- **Pull from iCloud** — downloads the last snapshot and replaces local data (used on a new device or after reinstall).

Sync is manual and snapshot-based: there is no automatic merging. The app also tries to pull once on launch (`syncFromCloudIfAvailable` in the root layout) so a fresh install can load the latest snapshot if one exists.

**If you see “You don’t have permission to save the file … in the folder ‘System’”:** the app was trying to write to iCloud without a valid container. Follow the steps above (Apple Developer Portal → enable iCloud + container, then rebuild). After the fix, the app uses the proper iCloud path and skips sync when iCloud isn’t available instead of throwing.

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
