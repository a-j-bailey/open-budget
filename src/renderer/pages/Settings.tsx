import { useState } from 'react'
import { Trash2, Sun, Moon, Monitor, FolderOpen, Plus } from 'lucide-react'
import { useThemeContext } from '../ThemeContext'
import type { Theme } from '../hooks/useTheme'
import { useRules } from '../hooks/useRules'
import { useBudget } from '../hooks/useBudget'
import * as electron from '../lib/electron'

export default function Settings() {
  const { theme, setTheme } = useThemeContext()
  const { rules, loading, error, addRule, updateRule, removeRule } = useRules()
  const { categories } = useBudget()
  const [pattern, setPattern] = useState('')
  const [source, setSource] = useState<'description' | 'category'>('description')
  const [targetCategoryId, setTargetCategoryId] = useState<string>('ignore')
  const [openFolderLoading, setOpenFolderLoading] = useState(false)

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault()
    const p = pattern.trim()
    if (!p) return
    addRule({ pattern: p, source, targetCategoryId: targetCategoryId === 'ignore' ? 'ignore' : targetCategoryId })
    setPattern('')
  }

  const isRuleValid = pattern.trim() !== ''

  const handleOpenDataDir = async () => {
    setOpenFolderLoading(true)
    try {
      await electron.openDataDir()
    } finally {
      setOpenFolderLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  const themeOptions: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      {error && (
        <p className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-2">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Choose light, dark, or match your system.
        </p>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`px-4 py-2 rounded text-sm font-medium inline-flex items-center gap-2 ${
                theme === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <opt.Icon className="size-4 shrink-0" />
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-2">Data folder</h2>
        <button
          type="button"
          onClick={handleOpenDataDir}
          disabled={openFolderLoading}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium inline-flex items-center gap-2"
        >
          <FolderOpen className="size-4 shrink-0" />
          {openFolderLoading ? 'Opening…' : 'Open data folder'}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Categorization rules</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Rules match transaction description or bank category and set budget category or ignore.
        </p>

        <form onSubmit={handleAddRule} className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pattern
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. Audible or /^AMZN/"
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Match
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as 'description' | 'category')}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="description">Description</option>
              <option value="category">Bank category</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Then
            </label>
            <select
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[140px]"
            >
              <option value="ignore">Ignore</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!isRuleValid}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="size-4 shrink-0" />
            Add rule
          </button>
        </form>

        {rules.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No rules yet.</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <span className="font-mono text-sm">{rule.pattern}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{rule.source}</span>
                <span className="text-sm">
                  → {rule.targetCategoryId === 'ignore' ? 'Ignore' : categories.find((c) => c.id === rule.targetCategoryId)?.name ?? rule.targetCategoryId}
                </span>
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  title="Remove rule"
                  aria-label="Remove rule"
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded ml-auto transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
