import { contextBridge, ipcRenderer } from 'electron'

const electron = {
  readConfig: () => ipcRenderer.invoke('readConfig'),
  writeConfig: (content: string) => ipcRenderer.invoke('writeConfig', content),
  readRules: () => ipcRenderer.invoke('readRules'),
  writeRules: (content: string) => ipcRenderer.invoke('writeRules', content),
  listExpenseMonths: () => ipcRenderer.invoke('listExpenseMonths'),
  readExpenses: (month?: string) => ipcRenderer.invoke('readExpenses', month),
  writeExpenses: (month: string | null, content: string) => ipcRenderer.invoke('writeExpenses', month, content),
  removeLegacyExpenses: () => ipcRenderer.invoke('removeLegacyExpenses'),
  getDataDir: () => ipcRenderer.invoke('getDataDir'),
  openDataDir: () => ipcRenderer.invoke('openDataDir'),
  showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
}

contextBridge.exposeInMainWorld('electron', electron)
