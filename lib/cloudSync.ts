import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getAllExpenses,
  getCategories,
  getRules,
  replaceAllExpenses,
  replaceCategories,
  replaceRules,
} from './db'
import type { BudgetCategory, ExpenseRow, Rule } from '../types'

export type Snapshot = {
  updatedAt: string
  categories: BudgetCategory[]
  rules: Rule[]
  expenses: ExpenseRow[]
}

export type SyncCounts = {
  categories: number
  rules: number
  expenses: number
}

export type PushResult = {
  success: boolean
  error?: string
  counts?: SyncCounts
  at?: string
}

export type PullResult = {
  success: boolean
  error?: string
  counts?: SyncCounts
  at?: string
}

const LAST_SYNC_KEY = 'household-budget-last-sync'
const ICLOUD_SYNC_ENABLED_KEY = 'household-budget-icloud-sync-enabled'

const CLOUD_KEY = 'household-budget-snapshot.json'
const ICLOUD_CONTAINER_ID = 'iCloud.com.magicmirrorcreative.householdbudget'

async function getCloudStore() {
  try {
    const mod = await import('react-native-cloud-store')
    return mod.default ?? mod
  } catch {
    return null
  }
}

/** Full iCloud path for the snapshot file. Requires iCloud container to be configured. */
async function getSnapshotICloudPath(
  cloud: Record<string, unknown>
): Promise<string | null> {
  try {
    const path =
      (await (cloud as any).getDefaultICloudContainerPath?.()) ??
      (await (cloud as any).getICloudURL?.(ICLOUD_CONTAINER_ID))
    if (!path || typeof path !== 'string') return null
    const base = path.replace(/\/$/, '')
    return `${base}/Documents/${CLOUD_KEY}`
  } catch {
    return null
  }
}

export type LastSyncState = {
  lastPushAt?: string
  lastPullAt?: string
  lastPushCounts?: SyncCounts
  lastPullCounts?: SyncCounts
}

export async function getLastSyncState(): Promise<LastSyncState> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SYNC_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LastSyncState
    return {
      lastPushAt: parsed.lastPushAt,
      lastPullAt: parsed.lastPullAt,
      lastPushCounts: parsed.lastPushCounts,
      lastPullCounts: parsed.lastPullCounts,
    }
  } catch {
    return {}
  }
}

async function setLastSyncState(update: Partial<LastSyncState>) {
  try {
    const current = await getLastSyncState()
    const next = { ...current, ...update }
    await AsyncStorage.setItem(LAST_SYNC_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

/** iCloud sync is off by default. User must enable it in Settings. */
export async function getICloudSyncEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ICLOUD_SYNC_ENABLED_KEY)
    return raw === 'true'
  } catch {
    return false
  }
}

export async function setICloudSyncEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ICLOUD_SYNC_ENABLED_KEY, enabled ? 'true' : 'false')
  } catch {
    // ignore
  }
}

export async function isICloudAvailable(): Promise<boolean> {
  const cloud = await getCloudStore()
  if (!cloud || typeof (cloud as any).isICloudAvailable !== 'function')
    return false
  try {
    return (await (cloud as any).isICloudAvailable()) === true
  } catch {
    return false
  }
}

/** Pushes to iCloud only if the user has enabled iCloud sync in Settings. Fire-and-forget. */
export function pushCloudSnapshotIfEnabled(): void {
  getICloudSyncEnabled().then((enabled) => {
    if (enabled) void pushCloudSnapshot()
  })
}

export async function pushCloudSnapshot(): Promise<PushResult> {
  const cloud = await getCloudStore()
  if (!cloud || typeof cloud.writeFile !== 'function') {
    return { success: false, error: 'iCloud not supported' }
  }
  try {
    const available =
      typeof (cloud as any).isICloudAvailable === 'function' &&
      (await (cloud as any).isICloudAvailable())
    if (!available) {
      return { success: false, error: 'iCloud not available (sign in or enable iCloud Drive)' }
    }
    const fullPath = await getSnapshotICloudPath(cloud)
    if (!fullPath) {
      return { success: false, error: 'iCloud container not configured' }
    }
    const categories = await getCategories()
    const rules = await getRules()
    const expenses = await getAllExpenses()
    const payload: Snapshot = {
      updatedAt: new Date().toISOString(),
      categories,
      rules,
      expenses,
    }
    await (cloud as any).writeFile(fullPath, JSON.stringify(payload), { override: true })
    const at = new Date().toISOString()
    const counts: SyncCounts = {
      categories: categories.length,
      rules: rules.length,
      expenses: expenses.length,
    }
    await setLastSyncState({ lastPushAt: at, lastPushCounts: counts })
    return { success: true, counts, at }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { success: false, error: message }
  }
}

export async function pullCloudSnapshot(): Promise<Snapshot | null> {
  const cloud = await getCloudStore()
  if (!cloud || typeof cloud.readFile !== 'function') return null
  try {
    const fullPath = await getSnapshotICloudPath(cloud)
    if (!fullPath) return null
    const raw = await (cloud as any).readFile(fullPath)
    if (!raw?.trim()) return null
    return JSON.parse(raw) as Snapshot
  } catch {
    return null
  }
}

export async function syncFromCloudIfAvailable(): Promise<PullResult> {
  const snapshot = await pullCloudSnapshot()
  if (!snapshot) {
    return { success: false, error: 'No snapshot in iCloud or iCloud unavailable' }
  }
  await replaceCategories(snapshot.categories)
  await replaceRules(snapshot.rules)
  await replaceAllExpenses(snapshot.expenses)
  const at = new Date().toISOString()
  const counts: SyncCounts = {
    categories: snapshot.categories.length,
    rules: snapshot.rules.length,
    expenses: snapshot.expenses.length,
  }
  await setLastSyncState({ lastPullAt: at, lastPullCounts: counts })
  return { success: true, counts, at }
}
