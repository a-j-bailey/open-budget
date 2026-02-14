import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeProvider } from './ThemeContext'
import { MonthProvider, useMonth, formatMonthLabel, prevMonthKey, nextMonthKey, currentMonthKey } from './MonthContext'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/expenses', label: 'Transactions', Icon: Receipt },
] as const

function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useMonth()
  const isCurrentMonth = selectedMonth === currentMonthKey()
  const canGoNext = selectedMonth < currentMonthKey()
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSelectedMonth((m) => prevMonthKey(m))}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 inline-flex items-center justify-center"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium text-gray-700 dark:text-gray-200">
        {formatMonthLabel(selectedMonth)}
        {isCurrentMonth && (
          <span className="ml-1.5 text-gray-500 dark:text-gray-400 font-normal">(current)</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => setSelectedMonth((m) => nextMonthKey(m))}
        disabled={!canGoNext}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 inline-flex items-center justify-center"
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function Header() {
  const loc = useLocation()
  const showMonthSelector = loc.pathname === '/' || loc.pathname === '/expenses'
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2">
      <nav className="flex gap-1">
        {navItems.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
              loc.pathname === to ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {showMonthSelector && <MonthSelector />}
        <Link
          to="/settings"
          className={`flex items-center justify-center p-2 rounded-md text-sm font-medium ${
            loc.pathname === '/settings' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          aria-label="Settings"
        >
          <SettingsIcon className="size-5 shrink-0" />
        </Link>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <MonthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
          <Header />
          <main className="p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        </div>
      </MonthProvider>
    </ThemeProvider>
  )
}
