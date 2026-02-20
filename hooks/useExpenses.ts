import { useCallback, useEffect, useState } from 'react'
import type { ExpenseRow, Rule } from '../types'
import { applyRules } from './useRules'
import { parseCSVToExpenses } from '../lib/csvParse'
import {
  getAllExpenses,
  getExpensesByMonth,
  listExpenseMonths,
  replaceExpensesForMonth,
} from '../lib/db'
import { pushCloudSnapshot } from '../lib/cloudSync'

function expenseKey(row: ExpenseRow): string {
  return `${row.transactionDate}|${row.description}|${row.debit}|${row.credit}`
}

function monthKey(row: ExpenseRow): string {
  return (row.transactionDate || '').slice(0, 7)
}

export function useExpenses(selectedMonthKey: string) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setExpenses(await getExpensesByMonth(selectedMonthKey))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [selectedMonthKey])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (rows: ExpenseRow[]) => {
      setError(null)
      try {
        await replaceExpensesForMonth(selectedMonthKey, rows)
        await pushCloudSnapshot()
        setExpenses(rows)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save expenses')
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
          const applied = applyRules(rules, row.description, row.category)
          return { ...row, ...applied }
        })
      }

      const months = await listExpenseMonths()
      const existingByMonth = new Map<string, ExpenseRow[]>()
      for (const m of months) {
        existingByMonth.set(m, await getExpensesByMonth(m))
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
        const existing = existingByMonth.get(m) ?? []
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
        await replaceExpensesForMonth(m, merged)
      }
      await pushCloudSnapshot()

      if (byMonth.has(selectedMonthKey)) {
        setExpenses(await getExpensesByMonth(selectedMonthKey))
      }

      const all = await getAllExpenses()
      return { added, total: all.length }
    },
    [selectedMonthKey]
  )

  const updateRow = useCallback(
    (index: number, updates: Partial<Pick<ExpenseRow, 'budgetCategoryId' | 'ignored'>>) => {
      const next = expenses.map((row, i) => (i === index ? { ...row, ...updates } : row))
      save(next)
    },
    [expenses, save]
  )

  const bulkUpdateRows = useCallback(
    (indices: number[], updates: Partial<Pick<ExpenseRow, 'budgetCategoryId' | 'ignored'>>) => {
      const indexSet = new Set(indices)
      const next = expenses.map((row, i) => (indexSet.has(i) ? { ...row, ...updates } : row))
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
      const row: ExpenseRow = {
        transactionDate: partial.transactionDate.trim(),
        postedDate: (partial.postedDate ?? partial.transactionDate).trim(),
        cardNo: (partial.cardNo ?? '').trim(),
        description: partial.description.trim(),
        category: (partial.category ?? '').trim(),
        debit: String(partial.debit).replace(/[,$]/g, '').trim() || '0',
        credit: String(partial.credit ?? '0').replace(/[,$]/g, '').trim() || '0',
        budgetCategoryId: partial.budgetCategoryId ?? null,
        ignored: partial.ignored ?? false,
      }
      const withRules =
        (row.budgetCategoryId == null || row.budgetCategoryId === '') && rulesToApply.length > 0
          ? (() => {
              const applied = applyRules(rulesToApply, row.description, row.category)
              return { ...row, ...applied }
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

export function useAllExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await getAllExpenses()
      all.sort((a, b) => (b.transactionDate || '').localeCompare(a.transactionDate || ''))
      setExpenses(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { expenses, loading, error, reload: load }
}
