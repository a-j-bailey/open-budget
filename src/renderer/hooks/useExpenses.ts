import { useState, useEffect, useCallback } from 'react'
import * as electron from '../lib/electron'
import { parseCSVToExpenses, expensesToCSV } from '../lib/csvParse'
import { applyRules } from './useRules'
import type { ExpenseRow } from '../types'
import type { Rule } from '../types'

const MIGRATION_KEY = 'household-budget-expenses-migrated'

function expenseKey(row: ExpenseRow): string {
  return `${row.transactionDate}|${row.description}|${row.debit}|${row.credit}`
}

function monthKey(row: ExpenseRow): string {
  return (row.transactionDate || '').slice(0, 7)
}

/** Run once: if legacy expenses.csv exists, split by month and write to expenses/YYYY-MM.csv */
export async function migrateLegacyExpensesIfNeeded(): Promise<void> {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return

  const raw = await electron.readExpenses(undefined)
  if (!raw?.trim()) {
    localStorage.setItem(MIGRATION_KEY, 'true')
    return
  }

  const rows = parseCSVToExpenses(raw)
  if (rows.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'true')
    return
  }

  const byMonth = new Map<string, ExpenseRow[]>()
  for (const row of rows) {
    const key = monthKey(row)
    if (!key || key.length !== 7) continue
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(row)
  }

  for (const [key, monthRows] of byMonth) {
    const sorted = [...monthRows].sort((a, b) =>
      (b.transactionDate || '').localeCompare(a.transactionDate || '')
    )
    await electron.writeExpenses(key, expensesToCSV(sorted))
  }

  try {
    await electron.removeLegacyExpenses()
  } catch {
    // Main process may not have handler yet (e.g. old build); migration still done
  }
  localStorage.setItem(MIGRATION_KEY, 'true')
}

/** Load expenses for a single month. Used by the Expenses page. */
export function useExpenses(selectedMonthKey: string) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationDone, setMigrationDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    migrateLegacyExpensesIfNeeded().then(() => {
      if (!cancelled) setMigrationDone(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    if (!migrationDone) return
    setLoading(true)
    setError(null)
    try {
      const raw = await electron.readExpenses(selectedMonthKey)
      if (raw?.trim()) {
        setExpenses(parseCSVToExpenses(raw))
      } else {
        setExpenses([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [selectedMonthKey, migrationDone])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (rows: ExpenseRow[]) => {
      setError(null)
      try {
        const csv = expensesToCSV(rows)
        await electron.writeExpenses(selectedMonthKey, csv)
        setExpenses(rows)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save expenses'
        setError(message)
        throw e
      }
    },
    [selectedMonthKey]
  )

  const importAndMerge = useCallback(
    async (csvContent: string, rules: Rule[] = []): Promise<{ added: number; total: number }> => {
      let newRows = parseCSVToExpenses(csvContent)
      if (rules.length > 0) {
        newRows = newRows.map((row) => {
          const { budgetCategoryId, ignored } = applyRules(rules, row.description, row.category)
          return { ...row, budgetCategoryId, ignored }
        })
      }

      const byMonth = new Map<string, ExpenseRow[]>()
      for (const row of newRows) {
        const m = monthKey(row)
        if (!m || m.length !== 7) continue
        if (!byMonth.has(m)) byMonth.set(m, [])
        byMonth.get(m)!.push(row)
      }

      let added = 0
      for (const [m, rowsForMonth] of byMonth) {
        const existingRaw = await electron.readExpenses(m)
        const existing = existingRaw?.trim() ? parseCSVToExpenses(existingRaw) : []
        const existingKeys = new Set(existing.map(expenseKey))
        const merged: ExpenseRow[] = [...existing]
        for (const row of rowsForMonth) {
          const key = expenseKey(row)
          if (!existingKeys.has(key)) {
            existingKeys.add(key)
            merged.push(row)
            added++
          }
        }
        merged.sort((a, b) => (b.transactionDate || '').localeCompare(a.transactionDate || ''))
        await electron.writeExpenses(m, expensesToCSV(merged))
      }

      if (byMonth.has(selectedMonthKey)) {
        const currentRaw = await electron.readExpenses(selectedMonthKey)
        const currentRows = currentRaw?.trim() ? parseCSVToExpenses(currentRaw) : []
        setExpenses(currentRows)
      }

      const months = await electron.listExpenseMonths()
      let total = 0
      for (const m of months) {
        const raw = await electron.readExpenses(m)
        if (raw?.trim()) total += parseCSVToExpenses(raw).length
      }

      return { added, total }
    },
    [selectedMonthKey]
  )

  const updateRow = useCallback(
    (index: number, updates: Partial<Pick<ExpenseRow, 'budgetCategoryId' | 'ignored'>>) => {
      const next = expenses.map((row, i) =>
        i === index ? { ...row, ...updates } : row
      )
      save(next)
    },
    [expenses, save]
  )

  const bulkUpdateRows = useCallback(
    (indices: number[], updates: Partial<Pick<ExpenseRow, 'budgetCategoryId' | 'ignored'>>) => {
      const indexSet = new Set(indices)
      const next = expenses.map((row, i) =>
        indexSet.has(i) ? { ...row, ...updates } : row
      )
      save(next)
    },
    [expenses, save]
  )

  const setAllExpenses = useCallback(
    (rows: ExpenseRow[]) => {
      save(rows)
    },
    [save]
  )

  const deleteRow = useCallback(
    (index: number) => {
      const next = expenses.filter((_, i) => i !== index)
      save(next)
    },
    [expenses, save]
  )

  const bulkDeleteRows = useCallback(
    (indices: number[]) => {
      const indexSet = new Set(indices)
      const next = expenses.filter((_, i) => !indexSet.has(i))
      save(next)
    },
    [expenses, save]
  )

  const addExpense = useCallback(
    (
      partial: {
        transactionDate: string
        description: string
        debit: string
        postedDate?: string
        cardNo?: string
        category?: string
        credit?: string
        budgetCategoryId?: string | null
        ignored?: boolean
      },
      rulesToApply: Rule[] = []
    ) => {
      const debit = String(partial.debit).replace(/[,$]/g, '').trim() || '0'
      const row: ExpenseRow = {
        transactionDate: partial.transactionDate.trim(),
        postedDate: (partial.postedDate ?? partial.transactionDate).trim(),
        cardNo: (partial.cardNo ?? '').trim(),
        description: partial.description.trim(),
        category: (partial.category ?? '').trim(),
        debit,
        credit: (partial.credit ?? '0').replace(/[,$]/g, '').trim() || '0',
        budgetCategoryId: partial.budgetCategoryId ?? null,
        ignored: partial.ignored ?? false,
      }
      const withRules =
        (row.budgetCategoryId == null || row.budgetCategoryId === '') && rulesToApply.length > 0
          ? (() => {
              const { budgetCategoryId, ignored } = applyRules(
                rulesToApply,
                row.description,
                row.category
              )
              return { ...row, budgetCategoryId, ignored }
            })()
          : row
      const merged = [...expenses, withRules].sort((a, b) =>
        (b.transactionDate || '').localeCompare(a.transactionDate || '')
      )
      save(merged)
    },
    [expenses, save]
  )

  return {
    expenses,
    loading,
    error,
    reload: load,
    save,
    importAndMerge,
    updateRow,
    bulkUpdateRows,
    deleteRow,
    bulkDeleteRows,
    setAllExpenses,
    addExpense,
  }
}

/** Load all expenses from all month files. Used by Dashboard for aggregates and charts. */
export function useAllExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationDone, setMigrationDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    migrateLegacyExpensesIfNeeded().then(() => {
      if (!cancelled) setMigrationDone(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    if (!migrationDone) return
    setLoading(true)
    setError(null)
    try {
      const months = await electron.listExpenseMonths()
      const all: ExpenseRow[] = []
      for (const m of months) {
        const raw = await electron.readExpenses(m)
        if (raw?.trim()) {
          const rows = parseCSVToExpenses(raw)
          for (const row of rows) {
            const rowMonth = (row.transactionDate || '').slice(0, 7)
            if (!rowMonth || rowMonth.length !== 7 || rowMonth !== m) {
              all.push({ ...row, transactionDate: `${m}-01` })
            } else {
              all.push(row)
            }
          }
        }
      }
      all.sort((a, b) => (b.transactionDate || '').localeCompare(a.transactionDate || ''))
      setExpenses(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [migrationDone])

  useEffect(() => {
    load()
  }, [load])

  return { expenses, loading, error, reload: load }
}
