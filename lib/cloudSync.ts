import {
  getAllExpenses,
  getCategories,
  getRules,
  replaceAllExpenses,
  replaceCategories,
  replaceRules,
} from './db'
import type { BudgetCategory, ExpenseRow, Rule } from '../types'

type Snapshot = {
  updatedAt: string
  categories: BudgetCategory[]
  rules: Rule[]
  expenses: ExpenseRow[]
}

const CLOUD_KEY = 'household-budget-snapshot.json'

async function getCloudStore() {
  try {
    const mod = await import('react-native-cloud-store')
    return mod.default ?? mod
  } catch {
    return null
  }
}

export async function pushCloudSnapshot() {
  const cloud = await getCloudStore()
  if (!cloud || typeof cloud.writeFile !== 'function') return
  const payload: Snapshot = {
    updatedAt: new Date().toISOString(),
    categories: await getCategories(),
    rules: await getRules(),
    expenses: await getAllExpenses(),
  }
  await (cloud as any).writeFile(CLOUD_KEY, JSON.stringify(payload))
}

export async function pullCloudSnapshot(): Promise<Snapshot | null> {
  const cloud = await getCloudStore()
  if (!cloud || typeof cloud.readFile !== 'function') return null
  try {
    const raw = await (cloud as any).readFile(CLOUD_KEY)
    if (!raw?.trim()) return null
    return JSON.parse(raw) as Snapshot
  } catch {
    return null
  }
}

export async function syncFromCloudIfAvailable() {
  const snapshot = await pullCloudSnapshot()
  if (!snapshot) return false
  await replaceCategories(snapshot.categories)
  await replaceRules(snapshot.rules)
  await replaceAllExpenses(snapshot.expenses)
  return true
}
