import type { BudgetConfig, RulesConfig } from '../types'

function getElectron() {
  if (typeof window === 'undefined') {
    throw new Error('Electron API is not available (no window).')
  }
  const electron = (window as unknown as { electron?: typeof window.electron }).electron
  if (!electron) {
    throw new Error(
      'Electron API is not available. Run the app with "npm run dev" from the project folder so it opens in Electron, not in a browser.'
    )
  }
  return electron
}

export async function readConfig(): Promise<string | null> {
  return getElectron().readConfig()
}

export async function writeConfig(config: BudgetConfig): Promise<void> {
  await getElectron().writeConfig(JSON.stringify(config, null, 2))
}

export async function readRules(): Promise<string | null> {
  return getElectron().readRules()
}

export async function writeRules(rules: RulesConfig): Promise<void> {
  await getElectron().writeRules(JSON.stringify(rules, null, 2))
}

export async function listExpenseMonths(): Promise<string[]> {
  return getElectron().listExpenseMonths()
}

export async function readExpenses(month?: string): Promise<string | null> {
  return getElectron().readExpenses(month)
}

export async function writeExpenses(month: string | null, content: string): Promise<void> {
  await getElectron().writeExpenses(month, content)
}

export async function removeLegacyExpenses(): Promise<void> {
  await getElectron().removeLegacyExpenses()
}

export async function getDataDir(): Promise<string> {
  return getElectron().getDataDir()
}

export async function openDataDir(): Promise<void> {
  return getElectron().openDataDir()
}

export async function showOpenDialog(): Promise<string | null> {
  return getElectron().showOpenDialog()
}
