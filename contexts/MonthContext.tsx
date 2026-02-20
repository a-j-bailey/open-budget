import { createContext, useContext, useState, type ReactNode } from 'react'

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function prevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  date.setMonth(date.getMonth() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

type MonthContextValue = {
  selectedMonth: string
  setSelectedMonth: (value: string | ((prev: string) => string)) => void
}

const MonthContext = createContext<MonthContextValue | null>(null)

export function MonthProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used within MonthProvider')
  return ctx
}
