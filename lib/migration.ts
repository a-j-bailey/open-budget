import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { parseCSVToExpenses } from './csvParse'
import { replaceAllExpenses, replaceCategories, replaceRules } from './db'
import type { BudgetConfig, RulesConfig } from '../types'

export const MIGRATION_DONE_KEY = 'household-budget-rn-migrated'

async function readUri(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri)
}

export async function isMigrationDone() {
  return (await AsyncStorage.getItem(MIGRATION_DONE_KEY)) === 'true'
}

export async function markMigrationDone() {
  await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true')
}

export async function runMigrationFromFiles() {
  const picked = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: ['text/*', 'application/json', 'text/csv'],
  })
  if (picked.canceled) return { imported: false, reason: 'canceled' as const }

  let config: BudgetConfig | null = null
  let rules: RulesConfig | null = null
  const allExpenses = []

  for (const asset of picked.assets) {
    const name = asset.name.toLowerCase()
    const content = await readUri(asset.uri)
    if (name === 'config.json') {
      config = JSON.parse(content) as BudgetConfig
    } else if (name === 'rules.json') {
      rules = JSON.parse(content) as RulesConfig
    } else if (name.endsWith('.csv')) {
      allExpenses.push(...parseCSVToExpenses(content))
    }
  }

  if (config?.categories) await replaceCategories(config.categories)
  if (rules?.rules) await replaceRules(rules.rules)
  if (allExpenses.length > 0) await replaceAllExpenses(allExpenses)

  const changed = Boolean(config || rules || allExpenses.length > 0)
  if (changed) await markMigrationDone()
  return { imported: changed, reason: changed ? ('ok' as const) : ('empty' as const) }
}
