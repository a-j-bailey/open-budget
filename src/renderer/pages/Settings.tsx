import { useState } from 'react'
import { Trash2, Sun, Moon, Monitor, FolderOpen, Plus, Sliders, ListChecks } from 'lucide-react'
import { useThemeContext } from '../ThemeContext'
import type { Theme } from '../hooks/useTheme'
import { useRules } from '../hooks/useRules'
import { useBudget } from '../hooks/useBudget'
import * as electron from '../lib/electron'

type TabId = 'settings' | 'rules'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('settings')
  const { theme, setTheme } = useThemeContext()
  const { rules, loading, error, addRule, removeRule } = useRules()
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

  const themeOptions: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ]

  const tabs: { id: TabId; label: string; Icon: typeof Sliders }[] = [
    { id: 'settings', label: 'Settings', Icon: Sliders },
    { id: 'rules', label: 'Rules', Icon: ListChecks },
  ]

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2 rounded-t -mb-px transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-b-0 border-gray-200 dark:border-gray-700 border-b-transparent'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <tab.Icon className="size-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <>
          <section className="flex flex-row items-center justify-between gap-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-medium">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Choose light, dark, or match your system.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5 shrink-0">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
                    theme === opt.value
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <opt.Icon className="size-4 shrink-0" />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-row items-center justify-between gap-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-medium">Data folder</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Open the folder where your data is stored.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenDataDir}
              disabled={openFolderLoading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium inline-flex items-center gap-2 shrink-0"
            >
              <FolderOpen className="size-4 shrink-0" />
              {openFolderLoading ? 'Opening…' : 'Open data folder'}
            </button>
          </section>
        </>
      )}

      {activeTab === 'rules' && (
        <section>
          {error && (
            <p className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
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
      )}
    </div>
  )
}
