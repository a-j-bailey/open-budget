import { ScrollView, Text, View } from 'react-native'
import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native'
import { useBudget } from '../../hooks/useBudget'
import { useAllExpenses } from '../../hooks/useExpenses'
import { useMonthlyTotals, useMonthlyTotalsForMonth } from '../../hooks/useMonthlyTotals'
import { useMonth } from '../../contexts/MonthContext'
import { useThemeContext } from '../../contexts/ThemeContext'
import {
  SpendingByCategoryLineChart,
  SpendingByCategoryPieChart,
  TotalByMonthChart,
} from '../../components/ChartPanel'

export default function Dashboard() {
  const { categories } = useBudget()
  const { expenses } = useAllExpenses()
  const { selectedMonth } = useMonth()
  const { isDark } = useThemeContext()
  const [categoryTab, setCategoryTab] = useState<'income' | 'expenses'>('expenses')

  const cardShadow = isDark ? { boxShadow: '0 1px 3px rgba(0,0,0,0.4)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
  const bg = isDark ? '#1c1917' : '#fff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const mutedColor = isDark ? '#a8a29e' : '#78716c'
  const bodyColor = isDark ? '#d6d3d1' : '#44403c'
  const segmentActiveBg = isDark ? '#44403c' : '#e7e5e4'
  const barBg = isDark ? '#292524' : '#e7e5e4'

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
        ] as { name: string; [key: string]: string | number }[])

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        selectable
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: titleColor,
          letterSpacing: -0.6,
          marginBottom: 4,
        }}
      >
        Dashboard
      </Text>

      {/* Month summary hero card */}
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 20,
          borderWidth: 1,
          borderColor: border,
          ...cardShadow,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: mutedColor,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {selectedMonth}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowDownCircle size={20} color="#16a34a" />
          <Text style={{ fontSize: 15, color: bodyColor, flex: 1 }}>Income</Text>
          <Text selectable style={{ fontSize: 16, fontWeight: '600', color: '#16a34a' }}>
            +${income.toFixed(2)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
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
            paddingTop: 16,
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
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 20,
          borderWidth: 1,
          borderColor: border,
          ...cardShadow,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor, marginBottom: 12 }}>
          By category
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: categoryTab === 'income' ? segmentActiveBg : 'transparent',
            }}
          >
            <Text
              onPress={() => setCategoryTab('income')}
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: categoryTab === 'income' ? titleColor : mutedColor,
              }}
            >
              Income
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: categoryTab === 'expenses' ? segmentActiveBg : 'transparent',
            }}
          >
            <Text
              onPress={() => setCategoryTab('expenses')}
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: categoryTab === 'expenses' ? titleColor : mutedColor,
              }}
            >
              Expenses
            </Text>
          </View>
        </View>
        {visible.length === 0 ? (
          <Text style={{ fontSize: 14, color: mutedColor }}>No categories yet.</Text>
        ) : (
          visible.map((cat) => {
            const spent = byCategory[cat.id] ?? 0
            const pct = cat.monthlyLimit > 0 ? Math.min(1, spent / cat.monthlyLimit) : 0
            return (
              <View key={cat.id} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, color: bodyColor }}>{cat.name}</Text>
                  <Text
                    selectable
                    style={{ fontSize: 13, color: mutedColor, fontVariant: ['tabular-nums'] }}
                  >
                    ${spent.toFixed(2)} / ${cat.monthlyLimit.toFixed(2)}
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
                      backgroundColor: '#0d9488',
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            )
          })
        )}
      </View>

      <View style={{ gap: 24 }}>
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
