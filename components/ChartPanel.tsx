import { useState } from 'react'
import { Text, useWindowDimensions, View } from 'react-native'
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
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
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
          marginBottom: monthKey ? 4 : 10,
        }}
      >
        {title}
      </Text>
      {monthKey ? (
        <Text style={{ fontSize: 12, color: muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {monthKey}
        </Text>
      ) : null}
      {pieData.length === 0 ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data for this period.</Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <PieChart
              data={pieData}
              donut
              radius={100}
              innerRadius={52}
              showText={false}
              focusOnPress
              showGradient={false}
              innerCircleColor={bg}
              innerCircleBorderWidth={0}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    selectable
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: titleColor,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    ${pieData.reduce((s, i) => s + i.value, 0).toFixed(0)}
                  </Text>
                  <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>total</Text>
                </View>
              )}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
            {pieData.map((item, index) => (
              <View
                key={`${item.text}-${index}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: '45%' }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: item.color,
                  }}
                />
                <Text numberOfLines={1} style={{ fontSize: 13, color: isDark ? '#d6d3d1' : '#44403c', flex: 1 }}>
                  {item.text}
                </Text>
                <Text
                  selectable
                  style={{ fontSize: 12, fontWeight: '500', color: muted, fontVariant: ['tabular-nums'] }}
                >
                  ${item.value.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const INCOME_COLOR = '#16a34a'
const EXPENSE_COLOR = '#dc2626'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthKeyToName(monthKey: string): string {
  const mm = monthKey.slice(5)
  const i = parseInt(mm, 10)
  return Number.isNaN(i) || i < 1 || i > 12 ? mm : MONTH_NAMES[i - 1]
}

export function TotalByMonthChart({
  data,
  title,
}: {
  data: { monthKey: string; income: number; expenses: number }[]
  title: string
}) {
  const { isDark } = useThemeContext()
  const [chartWidth, setChartWidth] = useState(0)
  const { width: windowWidth } = useWindowDimensions()
  const maxChartWidth = Math.max(0, windowWidth - 52)

  const barData = data.flatMap((d) => {
    const monthLabel = monthKeyToName(d.monthKey)
    return [
      {
        value: d.income,
        label: monthLabel,
        spacing: 2,
        labelWidth: 30,
        labelTextStyle: { color: isDark ? '#a8a29e' : '#78716c' },
        frontColor: INCOME_COLOR,
      },
      { value: d.expenses, frontColor: EXPENSE_COLOR },
    ]
  })

  const maxValue =
    data.length > 0
      ? Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1)
      : 1
  const chartMax = Math.ceil(maxValue * 1.15)

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <Text
        style={{
          color: titleColor,
          fontSize: 15,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: INCOME_COLOR,
              marginRight: 8,
            }}
          />
          <Text style={{ color: muted, fontSize: 13 }}>Income</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: EXPENSE_COLOR,
              marginRight: 8,
            }}
          />
          <Text style={{ color: muted, fontSize: 13 }}>Expenses</Text>
        </View>
      </View>
      {barData.length === 0 ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data.</Text>
        </View>
      ) : (
        <View
          style={{ width: '100%', overflow: 'hidden' }}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {chartWidth > 0 && (
            <View style={{ width: Math.min(chartWidth, maxChartWidth), overflow: 'hidden' }}>
              <BarChart
                data={barData}
                barWidth={8}
                spacing={24}
                width={Math.min(chartWidth, maxChartWidth)}
                adjustToWidth
                parentWidth={Math.min(chartWidth, maxChartWidth)}
                disableScroll
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisLabelPrefix="$"
                yAxisTextStyle={{ color: muted, fontSize: 11 }}
                noOfSections={3}
                maxValue={chartMax}
                isAnimated
                />
            </View>
          )}
        </View>
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
  const [chartWidth, setChartWidth] = useState(0)
  const { width: windowWidth } = useWindowDimensions()
  const maxChartWidth = Math.max(0, windowWidth - 52)

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
          borderRadius: 14,
          borderCurve: 'continuous',
          padding: 14,
          borderWidth: 1,
          borderColor: border,
          ...(isDark ? cardShadowDark : cardShadow),
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 10 }}>{title}</Text>
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>No data for this period.</Text>
        </View>
      </View>
    )
  }

  const dataSet = expenseCategories.map((cat, i) => ({
    data: aggregates.map((a) => ({
      value: a.byCategory[cat.id] ?? 0,
      label: a.monthKey.slice(5),
      dataPointText: `$${(a.byCategory[cat.id] ?? 0).toFixed(0)}`,
    })),
    color: COLORS[i % COLORS.length],
    thickness: 2,
    dataPointsRadius: 4,
    hideDataPoints: false,
  }))

  const maxValue =
    dataSet.length > 0
      ? Math.max(
          ...dataSet.flatMap((ds) => ds.data.map((d) => d.value)),
          1
        )
      : 1
  const chartMax = Math.ceil(maxValue * 1.15)

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
        Trend by category (tap points)
      </Text>
      <View
        style={{ width: '100%', overflow: 'hidden' }}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <View style={{ width: Math.min(chartWidth, maxChartWidth), overflow: 'hidden' }}>
            <LineChart
              dataSet={dataSet}
              width={Math.min(chartWidth, maxChartWidth)}
              adjustToWidth
              disableScroll
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisLabelPrefix="$"
              hideRules={false}
              rulesColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              rulesType="solid"
              isAnimated
              maxValue={chartMax}
              noOfSections={4}
              stepValue={chartMax / 4}
              focusEnabled
              showStripOnFocus
              showTextOnFocus
              xAxisLabelTextStyle={{ fontSize: 12, color: muted }}
              yAxisTextStyle={{ fontSize: 11, color: muted }}
            />
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {expenseCategories.map((cat, i) => (
          <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
            <Text numberOfLines={1} style={{ fontSize: 11, color: muted }}>{cat.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
