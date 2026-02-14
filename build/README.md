# Build resources (electron-builder)

This folder is used by **electron-builder** for installer and app icons (`directories.buildResources` in `electron-builder.yml`). If empty, electron-builder uses default icons.

## Optional: custom icons for installers

Place platform-specific icon files here so the packaged app and installers use your icon:

| Platform | File       | Notes |
| -------- | ---------- | ----- |
| macOS    | `icon.icns`| e.g. from a 512×512 or 1024×1024 PNG using `iconutil` or [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder) |
| Windows  | `icon.ico` | Multi-size .ico (e.g. 16, 32, 48, 256). Use [png2icons](https://www.npmjs.com/package/png2icons) or similar |
| Linux    | `icon.png` | Often a 256×256 or 512×512 PNG is enough |

You can generate these from a single high-res **`resources/icon.png`** (used at runtime by the app). The in-app window/dock icon is loaded from `resources/icon.png` (copied to `out/main/resources/`); the files in **`build/`** are for the OS-level app icon and installers.
