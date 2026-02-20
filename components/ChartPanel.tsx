import { ScrollView, Text, View } from 'react-native'
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts'
import type { BudgetCategory, MonthlyAggregate } from '../types'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

type SpendingByCategoryPieChartProps = {
  data: { name: string; [key: string]: string | number }[]
  categories: BudgetCategory[]
  title: string
  monthKey?: string
}

export function SpendingByCategoryPieChart({
  data,
  categories,
  title,
  monthKey,
}: SpendingByCategoryPieChartProps) {
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
  const row = data[0]
  const pieData: { value: number; text: string; color: string }[] = []
  let colorIndex = 0

  if (row) {
    for (const key of Object.keys(row)) {
      if (key === 'name') continue
      const value = Number(row[key]) ?? 0
      if (value <= 0) continue
      const label = key === '__uncategorized__' ? 'Uncategorized' : categoryById[key]?.name ?? key
      const color = key === '__uncategorized__' ? '#94a3b8' : COLORS[colorIndex++ % COLORS.length]
      pieData.push({ value, text: label, color })
    }
  }

  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Text className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
      {monthKey ? <Text className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{monthKey}</Text> : null}
      {pieData.length === 0 ? (
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">No data for this period.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PieChart
            data={pieData}
            donut
            radius={110}
            innerRadius={60}
            showText
            textColor="#1f2937"
            textSize={10}
            focusOnPress
            showGradient
          />
        </ScrollView>
      )}
    </View>
  )
}

export function TotalByMonthChart({
  data,
  title,
}: {
  data: { monthKey: string; income: number; expenses: number }[]
  title: string
}) {
  const chartData = data.map((d) => ({
    value: d.expenses,
    label: d.monthKey.slice(5),
    frontColor: '#ef4444',
    topLabelComponent: () => <Text className="text-[10px] text-zinc-500">-${d.expenses.toFixed(0)}</Text>,
  }))
  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Text className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
      {chartData.length === 0 ? (
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">No data.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            barWidth={26}
            spacing={20}
            roundedTop
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            noOfSections={5}
            isAnimated
            showValuesAsTopLabel
          />
        </ScrollView>
      )}
    </View>
  )
}

export function SpendingByCategoryLineChart({
  aggregates,
  categories,
  title,
}: {
  aggregates: MonthlyAggregate[]
  categories: BudgetCategory[]
  title: string
}) {
  const expenseCategories = categories.filter((c) => (c.type ?? 'expense') === 'expense')
  if (!expenseCategories.length || !aggregates.length) {
    return (
      <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Text className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400">No data for this period.</Text>
      </View>
    )
  }

  const category = expenseCategories[0]
  const lineData = aggregates.map((a) => ({
    value: a.byCategory[category.id] ?? 0,
    label: a.monthKey.slice(5),
    dataPointText: `$${(a.byCategory[category.id] ?? 0).toFixed(0)}`,
  }))

  return (
    <View className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Text className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
      <Text className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Interactive trend for {category.name} (tap points)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={lineData}
          color="#3b82f6"
          thickness={3}
          hideDataPoints={false}
          dataPointsColor="#3b82f6"
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules={false}
          isAnimated
          areaChart
          startFillColor="#93c5fd"
          endFillColor="#ffffff"
          startOpacity={0.4}
          endOpacity={0.05}
          focusEnabled
          showStripOnFocus
          showTextOnFocus
        />
      </ScrollView>
    </View>
  )
}
