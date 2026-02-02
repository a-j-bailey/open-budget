import { useState, useEffect, useCallback } from 'react'
import * as electron from '../lib/electron'
import type { RulesConfig, Rule } from '../types'

const defaultRules: RulesConfig = { rules: [] }

function parseRules(raw: string | null): RulesConfig {
  if (!raw?.trim()) return defaultRules
  try {
    const parsed = JSON.parse(raw) as RulesConfig
    if (Array.isArray(parsed.rules)) return parsed
  } catch {
    // ignore
  }
  return defaultRules
}

export function useRules() {
  const [config, setConfig] = useState<RulesConfig>(defaultRules)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await electron.readRules()
      setConfig(parseRules(raw))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(async (newConfig: RulesConfig) => {
    setError(null)
    try {
      await electron.writeRules(newConfig)
      setConfig(newConfig)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save rules')
    }
  }, [])

  const addRule = useCallback(
    (rule: Omit<Rule, 'id'>) => {
      const id = crypto.randomUUID()
      const next: RulesConfig = {
        rules: [...config.rules, { ...rule, id }],
      }
      save(next)
    },
    [config.rules, save]
  )

  const updateRule = useCallback(
    (id: string, updates: Partial<Omit<Rule, 'id'>>) => {
      const next: RulesConfig = {
        rules: config.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }
      save(next)
    },
    [config.rules, save]
  )

  const removeRule = useCallback(
    (id: string) => {
      const next: RulesConfig = {
        rules: config.rules.filter((r) => r.id !== id),
      }
      save(next)
    },
    [config.rules, save]
  )

  return {
    rules: config.rules,
    loading,
    error,
    reload: load,
    save,
    addRule,
    updateRule,
    removeRule,
  }
}

export function applyRules(
  rules: Rule[],
  description: string,
  bankCategory: string
): { budgetCategoryId: string | null; ignored: boolean } {
  for (const rule of rules) {
    const source = rule.source === 'description' ? description : bankCategory
    const match =
      rule.pattern.startsWith('/') && rule.pattern.endsWith('/')
        ? new RegExp(rule.pattern.slice(1, -1)).test(source)
        : source.toLowerCase().includes(rule.pattern.toLowerCase())
    if (match) {
      if (rule.targetCategoryId === 'ignore') {
        return { budgetCategoryId: null, ignored: true }
      }
      return { budgetCategoryId: rule.targetCategoryId, ignored: false }
    }
  }
  return { budgetCategoryId: null, ignored: false }
}
