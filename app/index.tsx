import { ScrollView, Text, View } from 'react-native'
import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native'
import { useBudget } from '../hooks/useBudget'
import { useAllExpenses } from '../hooks/useExpenses'
import { useMonthlyTotals, useMonthlyTotalsForMonth } from '../hooks/useMonthlyTotals'
import { useMonth } from '../contexts/MonthContext'
import {
  SpendingByCategoryLineChart,
  SpendingByCategoryPieChart,
  TotalByMonthChart,
} from '../components/ChartPanel'

export default function Dashboard() {
  const { categories } = useBudget()
  const { expenses } = useAllExpenses()
  const { selectedMonth } = useMonth()
  const [categoryTab, setCategoryTab] = useState<'income' | 'expenses'>('expenses')

  const aggregates = useMonthlyTotals(expenses)
  const { byCategory, total, income } = useMonthlyTotalsForMonth(expenses, selectedMonth)

  const totalByMonthData = aggregates.map((a) => ({
    monthKey: a.monthKey,
    income: a.income,
    expenses: a.total,
  }))

  const expenseCategories = categories.filter((c) => (c.type ?? 'expense') === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const visible = categoryTab === 'income' ? incomeCategories : expenseCategories

  const chartDataByCategory =
    total === 0
      ? []
      : ([
          {
            name: selectedMonth,
            ...Object.fromEntries(
              Object.entries(byCategory).filter(([id]) =>
                categoryTab === 'income'
                  ? incomeCategories.some((c) => c.id === id)
                  : expenseCategories.some((c) => c.id === id)
              )
            ),
          },
        ] as { name: string; [key: string]: string | number }[])

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <Text className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</Text>

      <View className="mb-4 gap-4">
        <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Month total ({selectedMonth})
          </Text>
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ArrowDownCircle size={16} color="#16a34a" />
              <Text className="text-zinc-700 dark:text-zinc-300">Income</Text>
            </View>
            <Text className="font-medium text-green-600">+${income.toFixed(2)}</Text>
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ArrowUpCircle size={16} color="#dc2626" />
              <Text className="text-zinc-700 dark:text-zinc-300">Expenses</Text>
            </View>
            <Text className="font-medium text-red-600">-${total.toFixed(2)}</Text>
          </View>
          <View className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <Text className="text-zinc-500 dark:text-zinc-400">Net</Text>
            <Text className={`text-lg font-semibold ${income - total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(income - total >= 0 ? '+' : '')}${(income - total).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="mb-2 flex-row gap-2">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">By Category</Text>
          </View>
          <View className="mb-3 flex-row gap-2">
            <Text
              onPress={() => setCategoryTab('income')}
              className={`rounded-lg px-3 py-2 text-sm ${categoryTab === 'income' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              Income
            </Text>
            <Text
              onPress={() => setCategoryTab('expenses')}
              className={`rounded-lg px-3 py-2 text-sm ${categoryTab === 'expenses' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              Expenses
            </Text>
          </View>
          {visible.length === 0 ? (
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">No categories yet.</Text>
          ) : (
            visible.map((cat) => {
              const spent = byCategory[cat.id] ?? 0
              const pct = cat.monthlyLimit > 0 ? Math.min(1, spent / cat.monthlyLimit) : 0
              return (
                <View key={cat.id} className="mb-3">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-sm text-zinc-700 dark:text-zinc-300">{cat.name}</Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      ${spent.toFixed(2)} / ${cat.monthlyLimit.toFixed(2)}
                    </Text>
                  </View>
                  <View className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <View
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(4, pct * 100)}%` }}
                    />
                  </View>
                </View>
              )
            })
          )}
        </View>
      </View>

      <View className="mb-4 gap-4">
        <SpendingByCategoryPieChart
          data={chartDataByCategory}
          categories={categories}
          title="Spending by category"
          monthKey={selectedMonth}
        />
        <TotalByMonthChart data={totalByMonthData} title="Total by month" />
        <SpendingByCategoryLineChart
          aggregates={aggregates}
          categories={categories}
          title="Spending by category per month"
        />
      </View>
    </ScrollView>
  )
}
