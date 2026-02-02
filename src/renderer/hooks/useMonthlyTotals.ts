import { useMemo } from 'react'
import type { ExpenseRow } from '../types'
import type { MonthlyAggregate } from '../types'

export function useMonthlyTotals(expenses: ExpenseRow[]): MonthlyAggregate[] {
  return useMemo(() => {
    const byMonth = new Map<string, Map<string, number>>()
    const incomeByMonth = new Map<string, number>()
    const expenseByMonth = new Map<string, number>()
    for (const row of expenses) {
      const debit = parseFloat(row.debit) || 0
      const credit = parseFloat(row.credit) || 0
      const monthKey = row.transactionDate ? row.transactionDate.slice(0, 7) : ''
      if (!monthKey) continue
      if (credit > 0 && !row.ignored) {
        incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) ?? 0) + credit)
        // Attribute credit to category so income categories (e.g. Paycheck) show correct totals
        if (!byMonth.has(monthKey)) byMonth.set(monthKey, new Map())
        const catMap = byMonth.get(monthKey)!
        const catId = row.budgetCategoryId ?? '__uncategorized__'
        catMap.set(catId, (catMap.get(catId) ?? 0) + credit)
      }
      if (debit > 0) {
        if (!row.ignored) {
          expenseByMonth.set(monthKey, (expenseByMonth.get(monthKey) ?? 0) + debit)
        }
        if (!byMonth.has(monthKey)) byMonth.set(monthKey, new Map())
        const catMap = byMonth.get(monthKey)!
        const catId = row.ignored ? '__ignored__' : row.budgetCategoryId ?? '__uncategorized__'
        catMap.set(catId, (catMap.get(catId) ?? 0) + debit)
      }
    }
    const result: MonthlyAggregate[] = []
    const sortedMonths = [...new Set([...byMonth.keys(), ...incomeByMonth.keys(), ...expenseByMonth.keys()])].sort()
    for (const monthKey of sortedMonths) {
      const catMap = byMonth.get(monthKey) ?? new Map()
      const byCategory: Record<string, number> = {}
      for (const [catId, sum] of catMap) {
        if (catId !== '__ignored__') {
          byCategory[catId] = sum
        }
      }
      const income = incomeByMonth.get(monthKey) ?? 0
      const total = expenseByMonth.get(monthKey) ?? 0
      result.push({ monthKey, byCategory, total, income })
    }
    return result
  }, [expenses])
}

export function useMonthlyTotalsForMonth(
  expenses: ExpenseRow[],
  monthKey: string | null
): { byCategory: Record<string, number>; total: number; income: number } {
  const aggregates = useMonthlyTotals(expenses)
  return useMemo(() => {
    if (!monthKey) return { byCategory: {}, total: 0, income: 0 }
    const agg = aggregates.find((a) => a.monthKey === monthKey)
    if (!agg) return { byCategory: {}, total: 0, income: 0 }
    return { byCategory: agg.byCategory, total: agg.total, income: agg.income }
  }, [aggregates, monthKey])
}
