import { useCallback, useEffect, useState } from 'react'
import type { Rule, RulesConfig } from '../types'
import {
  deleteRule as deleteRuleDb,
  getRules,
  insertRule,
  updateRule as updateRuleDb,
} from '../lib/db'
import { pushCloudSnapshot } from '../lib/cloudSync'

const defaultRules: RulesConfig = { rules: [] }

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useRules() {
  const [config, setConfig] = useState<RulesConfig>(defaultRules)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setConfig({ rules: await getRules() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rules')
      setConfig(defaultRules)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addRule = useCallback(
    async (rule: Omit<Rule, 'id'>) => {
      setError(null)
      try {
        await insertRule({ ...rule, id: makeId() })
        await pushCloudSnapshot()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save rules')
      }
    },
    [load]
  )

  const updateRule = useCallback(
    async (id: string, updates: Partial<Omit<Rule, 'id'>>) => {
      setError(null)
      try {
        await updateRuleDb(id, updates)
        await pushCloudSnapshot()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save rules')
      }
    },
    [load]
  )

  const removeRule = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await deleteRuleDb(id)
        await pushCloudSnapshot()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save rules')
      }
    },
    [load]
  )

  return {
    rules: config.rules,
    loading,
    error,
    reload: load,
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
