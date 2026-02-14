import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trash2, Sun, Moon, Monitor, FolderOpen, Plus, Sliders, ListChecks, Wallet } from 'lucide-react'
import { useThemeContext } from '../ThemeContext'
import type { Theme } from '../hooks/useTheme'
import { useRules } from '../hooks/useRules'
import { useBudget } from '../hooks/useBudget'
import * as electron from '../lib/electron'
import Budget from './Budget'

type TabId = 'settings' | 'rules' | 'budget'

const TAB_IDS: TabId[] = ['settings', 'rules', 'budget']

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    tabFromUrl && TAB_IDS.includes(tabFromUrl) ? tabFromUrl : 'settings'
  )

  useEffect(() => {
    if (tabFromUrl && TAB_IDS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const setTab = (id: TabId) => {
    setActiveTab(id)
    setSearchParams(id === 'settings' ? {} : { tab: id })
  }
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
    { id: 'budget', label: 'Budget', Icon: Wallet },
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
            onClick={() => setTab(tab.id)}
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

      {activeTab === 'budget' && <Budget embedded />}

      {activeTab === 'rules' && (
        <section className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              Categorization rules
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Rules match transaction description or bank category and set budget category or ignore.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add rule</h3>
            </div>
            <form onSubmit={handleAddRule} className="p-4 flex flex-wrap items-end gap-4">
              <div className="min-w-0">
                <label htmlFor="rule-pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Pattern
                </label>
                <input
                  id="rule-pattern"
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. Audible or /^AMZN/"
                  className="w-full min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="rule-match" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Match
                </label>
                <select
                  id="rule-match"
                  value={source}
                  onChange={(e) => setSource(e.target.value as 'description' | 'category')}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="description">Description</option>
                  <option value="category">Bank category</option>
                </select>
              </div>
              <div>
                <label htmlFor="rule-then" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Then
                </label>
                <select
                  id="rule-then"
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
              >
                <Plus className="size-4 shrink-0" />
                Add rule
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active rules {rules.length > 0 && <span className="text-gray-500 dark:text-gray-400 font-normal">({rules.length})</span>}
              </h3>
            </div>
            {rules.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No rules yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add a rule above to categorize transactions automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2.5 px-4 font-medium">Pattern</th>
                      <th className="py-2.5 px-4 font-medium">Match</th>
                      <th className="py-2.5 px-4 font-medium">Result</th>
                      <th className="py-2.5 px-4 w-12 text-right font-medium" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="group border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono text-gray-900 dark:text-gray-100">
                          {rule.pattern}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400 capitalize">
                          {rule.source}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">
                          {rule.targetCategoryId === 'ignore' ? (
                            <span className="text-gray-500 dark:text-gray-400 italic">Ignore</span>
                          ) : (
                            categories.find((c) => c.id === rule.targetCategoryId)?.name ?? rule.targetCategoryId
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeRule(rule.id)}
                            title="Remove rule"
                            aria-label="Remove rule"
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
