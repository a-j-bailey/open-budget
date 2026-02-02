import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import { existsSync } from 'fs'
import path from 'path'
import fs from 'fs/promises'

const DATA_DIR_NAME = 'household-budget'

function getDataDir(): string {
  return path.join(app.getPath('userData'), DATA_DIR_NAME)
}

function getExpensesDir(): string {
  return path.join(getDataDir(), 'expenses')
}

async function ensureDataDir(): Promise<void> {
  const dir = getDataDir()
  await fs.mkdir(dir, { recursive: true })
  await fs.mkdir(getExpensesDir(), { recursive: true })
}

function configPath(): string {
  return path.join(getDataDir(), 'config.json')
}

function rulesPath(): string {
  return path.join(getDataDir(), 'rules.json')
}

function expensesPath(month?: string): string {
  if (month) {
    return path.join(getExpensesDir(), `${month}.csv`)
  }
  return path.join(getDataDir(), 'expenses.csv')
}

function legacyExpensesPath(): string {
  return path.join(getDataDir(), 'expenses.csv')
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

async function writeFileSafe(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8')
}

function getResourcesDir(): string {
  const builtPath = path.join(__dirname, 'resources')
  if (existsSync(builtPath)) return builtPath
  return path.join(app.getAppPath(), 'resources')
}

function createWindow(): void {
  const preloadPath = path.resolve(__dirname, '../preload/index.mjs')
  const resourcesDir = getResourcesDir()
  // Use directory path so nativeImage can load icon.png + icon@2x.png for Retina (per Electron/Forge docs)
  const icon = nativeImage.createFromPath(path.join(resourcesDir, 'icon.png'))
  const iconImage = !icon.isEmpty() ? icon : undefined
  if (iconImage && process.platform === 'darwin') {
    app.dock.setIcon(iconImage)
  }
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: iconImage,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for ESM (.mjs) preload to run (Electron 20+)
    },
  })

  if (process.env.NODE_ENV !== 'production') {
    win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await ensureDataDir()

  ipcMain.handle('readConfig', async () => {
    const content = await readFileSafe(configPath())
    return content ?? null
  })

  ipcMain.handle('writeConfig', async (_event, content: string) => {
    await writeFileSafe(configPath(), content)
  })

  ipcMain.handle('readRules', async () => {
    const content = await readFileSafe(rulesPath())
    return content ?? null
  })

  ipcMain.handle('writeRules', async (_event, content: string) => {
    await writeFileSafe(rulesPath(), content)
  })

  ipcMain.handle('listExpenseMonths', async () => {
    try {
      const dir = getExpensesDir()
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const months = entries
        .filter((e) => e.isFile() && e.name.endsWith('.csv'))
        .map((e) => e.name.slice(0, -4))
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
      return months.sort()
    } catch {
      return []
    }
  })

  ipcMain.handle('readExpenses', async (_event, month?: string) => {
    const content = await readFileSafe(expensesPath(month))
    return content ?? null
  })

  ipcMain.handle('writeExpenses', async (_event, month: string | null, content: string) => {
    const filePath = month ? path.join(getExpensesDir(), `${month}.csv`) : path.join(getDataDir(), 'expenses.csv')
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await writeFileSafe(filePath, content)
  })

  ipcMain.handle('getDataDir', () => getDataDir())

  ipcMain.handle('openDataDir', async () => {
    await shell.openPath(getDataDir())
  })

  ipcMain.handle('removeLegacyExpenses', async () => {
    try {
      await fs.unlink(legacyExpensesPath())
    } catch {
      // ignore
    }
  })

  ipcMain.handle('showOpenDialog', async () => {
    const { dialog } = await import('electron')
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win ?? undefined, {
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const content = await fs.readFile(result.filePaths[0], 'utf-8')
    return content
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
