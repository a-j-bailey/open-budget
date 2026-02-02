import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
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

  const totalByMonthData = aggregates.map((a) => ({ monthKey: a.monthKey, total: a.total }))

  const categoryTotals = categories.map((cat) => ({
    ...cat,
    spent: byCategory[cat.id] ?? 0,
    limit: cat.monthlyLimit,
    over: (byCategory[cat.id] ?? 0) > cat.monthlyLimit,
  }))

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
  }: {
    id: string
    name: string
    spent: number
    limit: number
    over: boolean
    isIncome: boolean
  }) => (
    <tr className="odd:bg-gray-50 dark:odd:bg-gray-800/50 even:bg-white dark:even:bg-gray-900">
      <td className="py-1.5 px-2 font-semibold text-gray-900 dark:text-gray-100">{name}</td>
      <td className="py-1.5 px-2 text-right">
        {isIncome ? (
          <span className="text-green-600 dark:text-green-400 font-medium">+${spent.toFixed(2)}</span>
        ) : (
          <span className={over ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            ${spent.toFixed(2)}
          </span>
        )}
        <span className="text-gray-500 dark:text-gray-400 opacity-70 ml-0.5">
          / ${limit.toFixed(2)}
        </span>
      </td>
    </tr>
  )

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {isCurrentMonth ? 'This month' : 'Month'} total ({selectedMonth})
          </h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Income</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                +${income.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Expenses</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                −${total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Net</span>
              <span className={`text-lg font-semibold ${income - total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {(income - total >= 0 ? '+' : '')}${(income - total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
              <Link to="/budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                Add budget categories
              </Link>{' '}
              to see limits.
            </p>
          ) : (
            <>
              {categoryTab === 'income' ? (
                incomeCategories.length > 0 ? (
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <tbody>
                        {incomeCategories.map(({ id, name, spent, limit, over }) => (
                          <CategoryRow
                            key={id}
                            id={id}
                            name={name}
                            spent={spent}
                            limit={limit}
                            over={over}
                            isIncome
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No income categories.{' '}
                    <Link to="/budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Add on Budget
                    </Link>
                  </p>
                )
              ) : expenseCategories.length > 0 ? (
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <tbody>
                      {expenseCategories.map(({ id, name, spent, limit, over }) => (
                        <CategoryRow
                          key={id}
                          id={id}
                          name={name}
                          spent={spent}
                          limit={limit}
                          over={over}
                          isIncome={false}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No expense categories.{' '}
                  <Link to="/budget" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Add on Budget
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 mb-6 md:grid-cols-2">
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
        <Link to="/budget" className="text-blue-600 dark:text-blue-400 hover:underline">
          Edit budget
        </Link>
      </p>
    </div>
  )
}
