import { useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { BudgetCategory } from '../types'
import type { MonthlyAggregate } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  __uncategorized__: '#94a3b8',
}

const PIE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

interface ChartPanelProps {
  data: { name: string; [key: string]: string | number }[]
  categories: BudgetCategory[]
  title: string
  monthKey?: string
  stacked?: boolean
}

interface SpendingByCategoryPieChartProps {
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
  const pieData: { name: string; value: number; fill: string }[] = []
  let colorIndex = 0
  if (row) {
    for (const key of Object.keys(row)) {
      if (key === 'name') continue
      const value = Number(row[key]) ?? 0
      if (value <= 0) continue
      const label =
        key === '__uncategorized__'
          ? 'Uncategorized'
          : categoryById[key]?.name ?? key
      const fill =
        key === '__uncategorized__'
          ? CATEGORY_COLORS['__uncategorized__']
          : PIE_COLORS[colorIndex++ % PIE_COLORS.length]
      pieData.push({ name: label, value, fill })
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <h3 className="text-lg font-medium mb-4">
        {title}
        {monthKey && (
          <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">{monthKey}</span>
        )}
      </h3>
      {pieData.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data for this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, name: string) => [`$${Number(v).toFixed(2)}`, name]} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function ChartPanel({
  data,
  categories,
  title,
  monthKey,
  stacked = true,
}: ChartPanelProps) {
  const colors = [
    '#3b82f6',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ]
  categories.forEach((cat, i) => {
    CATEGORY_COLORS[cat.id] = colors[i % colors.length]
  })

  const bars = categories.map((cat) => (
    <Bar
      key={cat.id}
      dataKey={cat.id}
      name={cat.name}
      stackId={stacked ? 'a' : undefined}
      fill={CATEGORY_COLORS[cat.id]}
    />
  ))
  if (data.some((d) => d.__uncategorized__ !== undefined && Number(d.__uncategorized__) > 0)) {
    bars.push(
      <Bar
        key="__uncategorized__"
        dataKey="__uncategorized__"
        name="Uncategorized"
        stackId={stacked ? 'a' : undefined}
        fill={CATEGORY_COLORS['__uncategorized__']}
      />
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <h3 className="text-lg font-medium mb-4">
        {title}
        {monthKey && (
          <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">{monthKey}</span>
        )}
      </h3>
      {data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data for this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(2)}`, '']} />
            <Legend />
            {bars}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

interface TotalByMonthChartProps {
  data: { monthKey: string; income: number; expenses: number }[]
  title: string
}

export function TotalByMonthChart({ data, title }: TotalByMonthChartProps) {
  const chartData = data.map((d) => ({
    name: d.monthKey,
    income: d.income,
    expenses: d.expenses,
  }))
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      {chartData.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${name === 'income' ? '+' : '−'}$${Number(v).toFixed(2)}`,
                name === 'income' ? 'Income' : 'Expenses',
              ]}
              contentStyle={{
                backgroundColor: 'rgb(255 255 255)',
                color: 'rgb(15 23 42)',
                borderRadius: 8,
                border: '1px solid rgb(203 213 225)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'rgb(15 23 42)' }}
              itemStyle={{ color: 'rgb(15 23 42)' }}
              cursor={{ fill: 'rgb(241 245 249)', fillOpacity: 0.5 }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Income"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              activeBar={{ fill: '#4ade80', radius: [4, 4, 0, 0] }}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              activeBar={{ fill: '#f87171', radius: [4, 4, 0, 0] }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

const LINE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

interface SpendingByCategoryLineChartProps {
  aggregates: MonthlyAggregate[]
  categories: BudgetCategory[]
  title: string
}

/** Line chart: spending by category per month. Only expense categories are shown. Legend click toggles series. */
export function SpendingByCategoryLineChart({
  aggregates,
  categories,
  title,
}: SpendingByCategoryLineChartProps) {
  const expenseCategories = categories.filter((c) => (c.type ?? 'expense') === 'expense')
  const expenseIds = new Set(expenseCategories.map((c) => c.id))
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const chartData = aggregates.map((a) => {
    const row: { name: string; [key: string]: string | number } = { name: a.monthKey }
    for (const [catId, value] of Object.entries(a.byCategory)) {
      if (expenseIds.has(catId) || catId === '__uncategorized__') {
        row[catId] = value
      }
    }
    return row
  })

  const series = [
    ...expenseCategories.map((c) => ({ id: c.id, name: c.name })),
    ...(chartData.some((d) => Number(d['__uncategorized__']) > 0)
      ? [{ id: '__uncategorized__' as const, name: 'Uncategorized' }]
      : []),
  ]
  const colorByKey: Record<string, string> = { __uncategorized__: CATEGORY_COLORS['__uncategorized__'] }
  series.forEach((s, i) => {
    if (s.id !== '__uncategorized__') colorByKey[s.id] = LINE_COLORS[i % LINE_COLORS.length]
  })

  const toggle = useCallback((dataKey: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }, [])

  const renderLegend = useCallback(
    (props: { payload?: { value: string; dataKey: string; color: string }[] }) => {
      const payload = props.payload ?? []
      return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 list-none">
          {payload.map((entry) => {
            const hidden = hiddenIds.has(entry.dataKey)
            return (
              <li
                key={entry.dataKey}
                className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                onClick={() => toggle(entry.dataKey)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(entry.dataKey)}
                role="button"
                tabIndex={0}
                aria-pressed={!hidden}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: hidden ? 'var(--tw-gray-300, #d1d5db)' : entry.color }}
                />
                <span className={hidden ? 'text-gray-400 dark:text-gray-500 line-through' : ''}>
                  {entry.value}
                </span>
              </li>
            )
          })}
        </ul>
      )
    },
    [hiddenIds, toggle]
  )

  if (chartData.length === 0 || series.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data for this period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={440}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(v: number) => [`$${Number(v).toFixed(2)}`, '']}
            contentStyle={{
              backgroundColor: 'rgb(255 255 255)',
              color: 'rgb(15 23 42)',
              borderRadius: 8,
              border: '1px solid rgb(203 213 225)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: 'rgb(15 23 42)' }}
            itemStyle={{ color: 'rgb(15 23 42)' }}
            cursor={{ stroke: 'rgb(203 213 225)' }}
          />
          <Legend content={renderLegend} />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={colorByKey[s.id]}
              strokeWidth={2}
              dot={{ r: 3 }}
              hide={hiddenIds.has(s.id)}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
