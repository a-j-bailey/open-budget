import { ScrollView, Text, View } from 'react-native'
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts'
import type { BudgetCategory, MonthlyAggregate } from '../types'
import { useThemeContext } from '../contexts/ThemeContext'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

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
  const { isDark } = useThemeContext()
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

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 20,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: titleColor,
          marginBottom: monthKey ? 4 : 12,
        }}
      >
        {title}
      </Text>
      {monthKey ? (
        <Text style={{ fontSize: 12, color: muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {monthKey}
        </Text>
      ) : null}
      {pieData.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data for this period.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PieChart
            data={pieData}
            donut
            radius={110}
            innerRadius={60}
            showText
            textColor={isDark ? '#fafaf9' : '#1f2937'}
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
  const { isDark } = useThemeContext()
  const chartData = data.map((d) => ({
    value: d.expenses,
    label: d.monthKey.slice(5),
    frontColor: '#ef4444',
    topLabelComponent: () => (
      <Text style={{ fontSize: 10, color: isDark ? '#a8a29e' : '#78716c' }}>-${d.expenses.toFixed(0)}</Text>
    ),
  }))

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 20,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 16 }}>{title}</Text>
      {chartData.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data.</Text>
        </View>
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
  const { isDark } = useThemeContext()
  const expenseCategories = categories.filter((c) => (c.type ?? 'expense') === 'expense')

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'

  if (!expenseCategories.length || !aggregates.length) {
    return (
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 20,
          borderWidth: 1,
          borderColor: border,
          ...(isDark ? cardShadowDark : cardShadow),
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 12 }}>{title}</Text>
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data for this period.</Text>
        </View>
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
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 20,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 12, color: muted, marginBottom: 16 }}>
        Trend for {category.name} (tap points)
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
          startFillColor={isDark ? '#1e3a5f' : '#93c5fd'}
          endFillColor={isDark ? '#0c0a09' : '#ffffff'}
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
