import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useBudget } from '../hooks/useBudget'
import { useAllExpenses } from '../hooks/useExpenses'
import { useMonthlyTotals, useMonthlyTotalsForMonth } from '../hooks/useMonthlyTotals'
import { useMonth, currentMonthKey } from '../MonthContext'
import { SpendingByCategoryPieChart, TotalByMonthChart } from '../components/ChartPanel'

type CategoryTab = 'income' | 'expenses'

export default function Dashboard() {
  const { categories } = useBudget()
  const { expenses } = useAllExpenses()
  const { selectedMonth } = useMonth()
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('expenses')
  const aggregates = useMonthlyTotals(expenses)
  const { byCategory, total, income } = useMonthlyTotalsForMonth(expenses, selectedMonth)

  const prevMonthKey = (key: string): string | null => {
    const [y, m] = key.split('-').map(Number)
    if (m === 1) return `${y - 1}-12`
    return `${y}-${String(m - 1).padStart(2, '0')}`
  }
  const prevAgg = selectedMonth
    ? aggregates.find((a) => a.monthKey === prevMonthKey(selectedMonth))
    : undefined
  const byCategoryPrev = prevAgg?.byCategory ?? {}

  const totalByMonthData = aggregates.map((a) => ({
    monthKey: a.monthKey,
    income: a.income,
    expenses: a.total,
  }))

  const categoryTotals = categories.map((cat) => {
    const spent = byCategory[cat.id] ?? 0
    const prevSpent = byCategoryPrev[cat.id] ?? 0
    const trend =
      spent > prevSpent ? ('up' as const) : spent < prevSpent ? ('down' as const) : null
    return {
      ...cat,
      spent,
      limit: cat.monthlyLimit,
      over: spent > cat.monthlyLimit,
      trend,
    }
  })

  const incomeCategories = categoryTotals.filter((c) => c.type === 'income')
  const expenseCategories = categoryTotals.filter((c) => (c.type ?? 'expense') === 'expense')
  const expenseCategoryIds = new Set(expenseCategories.map((c) => c.id))

  const chartDataByCategory =
    total === 0
      ? []
      : ([
          {
            name: selectedMonth,
            ...Object.fromEntries(
              Object.entries(byCategory).filter(([id]) => expenseCategoryIds.has(id))
            ),
          },
        ] as { name: string; [key: string]: string | number }[])

  const isCurrentMonth = selectedMonth === currentMonthKey()

  const CategoryRow = ({
    id,
    name,
    spent,
    limit,
    over,
    isIncome,
    trend,
  }: {
    id: string
    name: string
    spent: number
    limit: number
    over: boolean
    isIncome: boolean
    trend: 'up' | 'down' | null
  }) => {
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
    const barColor = over ? 'bg-red-500 dark:bg-red-500' : 'bg-green-500 dark:bg-green-500'
    return (
      <tr className="odd:bg-gray-50 dark:odd:bg-gray-800/50 even:bg-white dark:even:bg-gray-900">
        <td className="py-1.5 px-2 text-xs font-medium text-gray-900 dark:text-gray-100 align-top pt-2">
          <span className="inline-flex items-center gap-1.5">
            {trend === 'up' && (
              <TrendingUp
                className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-label="Up from last month"
              />
            )}
            {trend === 'down' && (
              <TrendingDown
                className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400"
                aria-label="Down from last month"
              />
            )}
            {trend === null && (
              <Minus
                className="size-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                aria-label="No change from last month"
              />
            )}
            {name}
          </span>
        </td>
        <td className="py-1.5 px-2 min-w-[80px] max-w-[140px]">
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${name}: $${spent.toFixed(2)} of $${limit.toFixed(2)}`}
            />
          </div>
        </td>
        <td className="py-1.5 px-2 text-xs text-right align-top pt-2 whitespace-nowrap">
          {isIncome ? (
            <span className="text-green-600 dark:text-green-400 font-medium">+${spent.toFixed(2)}</span>
          ) : (
            <span className={over ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
              ${spent.toFixed(2)}
            </span>
          )}
          <span className="text-gray-500 dark:text-gray-400 opacity-70 ml-0.5 text-xs">
            / ${limit.toFixed(2)}
          </span>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {isCurrentMonth ? 'This month' : 'Month'} total
            <span className="font-normal text-gray-500 dark:text-gray-400 ml-1">({selectedMonth})</span>
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <ArrowDownCircle className="size-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
                Income
              </span>
              <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                +${income.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <ArrowUpCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                Expenses
              </span>
              <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                −${total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 pt-3 mt-3 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 -mx-4 px-4 py-3 rounded-b-lg">
              <span className="text-gray-800 dark:text-gray-200 font-semibold">Net</span>
              <span className={`text-lg font-bold tabular-nums ${income - total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {(income - total >= 0 ? '+' : '')}${(income - total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              By Category
            </h2>
            {categories.length > 0 && (
              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setCategoryTab('income')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                    categoryTab === 'income'
                      ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownCircle className="size-4 shrink-0" />
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('expenses')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                    categoryTab === 'expenses'
                      ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpCircle className="size-4 shrink-0" />
                  Expenses
                </button>
              </div>
            )}
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              <Link to="/settings?tab=budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                Add budget categories
              </Link>{' '}
              to see limits.
            </p>
          ) : (
            <>
              {categoryTab === 'income' ? (
                incomeCategories.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <tbody>
                        {incomeCategories.map(({ id, name, spent, limit, over, trend }) => (
                          <CategoryRow
                            key={id}
                            id={id}
                            name={name}
                            spent={spent}
                            limit={limit}
                            over={over}
                            isIncome
                            trend={trend}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No income categories.{' '}
                    <Link to="/settings?tab=budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Add on Budget
                    </Link>
                  </p>
                )
              ) : expenseCategories.length > 0 ? (
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <tbody>
                      {expenseCategories.map(({ id, name, spent, limit, over, trend }) => (
                        <CategoryRow
                          key={id}
                          id={id}
                          name={name}
                          spent={spent}
                          limit={limit}
                          over={over}
                          isIncome={false}
                          trend={trend}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No expense categories.{' '}
                  <Link to="/settings?tab=budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Add on Budget
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <SpendingByCategoryPieChart
          data={chartDataByCategory}
          categories={categories}
          title="Spending by category"
          monthKey={selectedMonth}
        />
        <TotalByMonthChart data={totalByMonthData} title="Total by month" />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link to="/expenses" className="text-blue-600 dark:text-blue-400 hover:underline">
          Import or edit transactions
        </Link>
        {' · '}
        <Link to="/settings?tab=budget" className="text-blue-600 dark:text-blue-400 hover:underline">
          Edit budget
        </Link>
      </p>
    </div>
  )
}
