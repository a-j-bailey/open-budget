import { Stack, Tabs, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useBudget } from '../../hooks/useBudget'
import { useAllExpenses } from '../../hooks/useExpenses'
import { useMonthlyTotals, useMonthlyTotalsForMonth } from '../../hooks/useMonthlyTotals'
import { useMonth } from '../../contexts/MonthContext'
import { useThemeContext } from '../../contexts/ThemeContext'
import { MonthSelector } from '../../components/MonthSelector'
import {
  SpendingByCategoryLineChart,
  SpendingByCategoryPieChart,
  TotalByMonthChart,
} from '../../components/ChartPanel'
import { OnboardingScreen } from '../../components/OnboardingScreen'

export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const { categories } = useBudget()
  const { expenses, loading, reload } = useAllExpenses()
  const { selectedMonth } = useMonth()

  // Refetch when this tab gains focus so we don't show onboarding with stale empty state
  // (e.g. if DB wasn't ready on first mount or user added data on another tab).
  useFocusEffect(
    useCallback(() => {
      reload()
    }, [reload])
  )
  const { isDark } = useThemeContext()
  const [categoryTab, setCategoryTab] = useState<'income' | 'expenses'>('expenses')

  const aggregates = useMonthlyTotals(expenses)
  const { byCategory, total, income } = useMonthlyTotalsForMonth(expenses, selectedMonth)

  if (!loading && expenses.length === 0) {
    return <OnboardingScreen />
  }

  const cardShadow = isDark ? { boxShadow: '0 1px 3px rgba(0,0,0,0.4)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const bg = isDark ? '#1c1917' : '#fff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const mutedColor = isDark ? '#a8a29e' : '#78716c'
  const bodyColor = isDark ? '#d6d3d1' : '#44403c'
  const segmentActiveBg = isDark ? '#44403c' : '#e7e5e4'
  const barBg = isDark ? '#292524' : '#e7e5e4'

  const prevMonthKey =
    selectedMonth &&
    (() => {
      const [y, m] = selectedMonth.split('-').map(Number)
      if (m <= 1) return `${y - 1}-12`
      return `${y}-${String(m - 1).padStart(2, '0')}`
    })()
  const prevByCategory = aggregates.find((a) => a.monthKey === prevMonthKey)?.byCategory ?? {}

  const totalByMonthData = aggregates.map((a) => ({
    monthKey: a.monthKey,
    income: a.income,
    expenses: a.total,
  }))

  const expenseCategories = categories.filter((c) => (c.type ?? 'expense') === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const visible = categoryTab === 'income' ? incomeCategories : expenseCategories
  const net = income - total

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
      ] as { name: string;[key: string]: string | number }[])

  return (
    <>
      <Tabs.Screen options={{ headerRight: () => (!loading && expenses.length === 0) ? null : <MonthSelector /> }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: 12,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month summary hero card */}
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 14,
            borderWidth: 1,
            borderColor: border,
            ...cardShadow,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: mutedColor,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {selectedMonth}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ArrowDownCircle size={20} color="#16a34a" />
            <Text style={{ fontSize: 15, color: bodyColor, flex: 1 }}>Income</Text>
            <Text selectable style={{ fontSize: 16, fontWeight: '600', color: '#16a34a' }}>
              +${income.toFixed(2)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ArrowUpCircle size={20} color="#dc2626" />
            <Text style={{ fontSize: 15, color: bodyColor, flex: 1 }}>Expenses</Text>
            <Text selectable style={{ fontSize: 16, fontWeight: '600', color: '#dc2626' }}>
              -${total.toFixed(2)}
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: border,
              paddingTop: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>Net</Text>
            <Text
              selectable
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: net >= 0 ? '#16a34a' : '#dc2626',
                fontVariant: ['tabular-nums'],
              }}
            >
              {(net >= 0 ? '+' : '')}${net.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* By category */}
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 14,
            borderWidth: 1,
            borderColor: border,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor }}>
              By category
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable
                onPress={() => setCategoryTab('income')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: categoryTab === 'income' ? segmentActiveBg : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: categoryTab === 'income' ? titleColor : mutedColor,
                  }}
                >
                  Income
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCategoryTab('expenses')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: categoryTab === 'expenses' ? segmentActiveBg : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: categoryTab === 'expenses' ? titleColor : mutedColor,
                  }}
                >
                  Expenses
                </Text>
              </Pressable>
            </View>
          </View>
          {visible.length === 0 ? (
            <Text style={{ fontSize: 14, color: mutedColor }}>No categories yet.</Text>
          ) : (
            visible.map((cat) => {
              const spent = byCategory[cat.id] ?? 0
              const prevSpent = prevByCategory[cat.id] ?? 0
              const limit = cat.monthlyLimit
              const isOverBudget = limit > 0 && spent > limit
              const pct = limit > 0 ? Math.min(1, spent / limit) : 0
              const barColor = isOverBudget ? '#dc2626' : '#0d9488'
              const amountColor = isOverBudget ? '#dc2626' : mutedColor
              const trendUp = spent > prevSpent
              const trendDown = spent < prevSpent
              return (
                <View key={cat.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14, color: bodyColor }}>{cat.name}</Text>
                      {trendUp && <TrendingUp size={14} color={categoryTab === 'expenses' ? '#dc2626' : '#16a34a'} />}
                      {trendDown && <TrendingDown size={14} color={categoryTab === 'expenses' ? '#16a34a' : '#dc2626'} />}
                    </View>
                    <Text
                      selectable
                      style={{ fontSize: 13, color: amountColor, fontVariant: ['tabular-nums'] }}
                    >
                      ${spent.toFixed(2)} / ${limit.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: barBg,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.max(4, pct * 100)}%`,
                        backgroundColor: barColor,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              )
            })
          )}
        </View>

        <View style={{ gap: 14 }}>
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
    </>
  )
}
