import { useState, useEffect, useCallback } from 'react'
import * as electron from '../lib/electron'
import type { BudgetConfig, BudgetCategory } from '../types'

const defaultConfig: BudgetConfig = { categories: [] }

function parseConfig(raw: string | null): BudgetConfig {
  if (!raw?.trim()) return defaultConfig
  try {
    const parsed = JSON.parse(raw) as BudgetConfig
    if (Array.isArray(parsed.categories)) return parsed
  } catch {
    // ignore
  }
  return defaultConfig
}

export function useBudget() {
  const [config, setConfig] = useState<BudgetConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await electron.readConfig()
      setConfig(parseConfig(raw))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(async (newConfig: BudgetConfig) => {
    setError(null)
    try {
      await electron.writeConfig(newConfig)
      setConfig(newConfig)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save config')
    }
  }, [])

  const addCategory = useCallback(
    (name: string, monthlyLimit: number, type: 'expense' | 'income' = 'expense') => {
      const id = crypto.randomUUID()
      const next: BudgetConfig = {
        categories: [...config.categories, { id, name, monthlyLimit, type }],
      }
      save(next)
    },
    [config.categories, save]
  )

  const updateCategory = useCallback(
    (id: string, updates: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'type'>>) => {
      const next: BudgetConfig = {
        categories: config.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }
      save(next)
    },
    [config.categories, save]
  )

  const removeCategory = useCallback(
    (id: string) => {
      const next: BudgetConfig = {
        categories: config.categories.filter((c) => c.id !== id),
      }
      save(next)
    },
    [config.categories, save]
  )

  return {
    config,
    categories: config.categories,
    loading,
    error,
    reload: load,
    save,
    addCategory,
    updateCategory,
    removeCategory,
  }
}
