import { useCallback, useEffect, useState } from 'react'
import type { BudgetCategory, BudgetConfig } from '../types'
import {
  getCategories,
  insertCategory,
  updateCategory as updateCategoryDb,
  deleteCategory as deleteCategoryDb,
} from '../lib/db'
import { pushCloudSnapshotIfEnabled } from '../lib/cloudSync'

const defaultConfig: BudgetConfig = { categories: [] }

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useBudget() {
  const [config, setConfig] = useState<BudgetConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const categories = await getCategories()
      setConfig({ categories })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config')
      setConfig(defaultConfig)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addCategory = useCallback(
    async (name: string, monthlyLimit: number, type: 'expense' | 'income' = 'expense') => {
      setError(null)
      try {
        await insertCategory({ id: makeId(), name, monthlyLimit, type })
        pushCloudSnapshotIfEnabled()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save config')
      }
    },
    [load]
  )

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'type'>>) => {
      setError(null)
      try {
        await updateCategoryDb(id, updates)
        pushCloudSnapshotIfEnabled()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save config')
      }
    },
    [load]
  )

  const removeCategory = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await deleteCategoryDb(id)
        pushCloudSnapshotIfEnabled()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save config')
      }
    },
    [load]
  )

  return {
    config,
    categories: config.categories,
    loading,
    error,
    reload: load,
    addCategory,
    updateCategory,
    removeCategory,
  }
}
