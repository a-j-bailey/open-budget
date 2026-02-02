import { useState, useMemo } from 'react'
import { CreditCard, Wallet, Plus, Trash2 } from 'lucide-react'
import { useBudget } from '../hooks/useBudget'
import type { BudgetCategoryType } from '../types'

export default function Budget() {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    removeCategory,
  } = useBudget()
  const [viewMode, setViewMode] = useState<'debit' | 'credit'>('debit')
  const [newName, setNewName] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')

  const categoryType: BudgetCategoryType = viewMode === 'credit' ? 'income' : 'expense'
  const isCreditView = viewMode === 'credit'

  const expenseCategories = useMemo(
    () => categories.filter((c) => (c.type ?? 'expense') === 'expense'),
    [categories]
  )
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    const limit = parseFloat(newLimit)
    if (!name || Number.isNaN(limit) || limit < 0) return
    addCategory(name, limit, categoryType)
    setNewName('')
    setNewLimit('')
  }

  const isCategoryValid =
    newName.trim() !== '' &&
    !Number.isNaN(parseFloat(newLimit)) &&
    parseFloat(newLimit) >= 0

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Budget</h1>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  const visibleCategories = isCreditView ? incomeCategories : expenseCategories

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Budget</h1>
      {error && (
        <p className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories:</span>
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('debit')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
              viewMode === 'debit'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="size-4 shrink-0" />
            Debit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('credit')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5 ${
              viewMode === 'credit'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="size-4 shrink-0" />
            Credit
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={isCreditView ? 'e.g. Bonus' : 'e.g. Groceries'}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[140px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isCreditView ? 'Expected ($)' : 'Monthly limit ($)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            placeholder="0"
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm w-28"
          />
        </div>
        <button
          type="submit"
          disabled={!isCategoryValid}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="size-4 shrink-0" />
          Add category
        </button>
      </form>

      {visibleCategories.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {isCreditView
            ? 'No credit (income) categories yet. Add one above or switch to Debit to manage expense categories.'
            : 'No debit (expense) categories yet. Add one above or switch to Credit to manage income categories.'}
        </p>
      ) : (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {isCreditView ? 'Credit (income) categories' : 'Debit (expense) categories'}
          </h2>
          <ul className="space-y-2">
            {visibleCategories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <input
                  type="text"
                  value={editingNameId === cat.id ? editingNameValue : cat.name}
                  onChange={(e) => {
                    setEditingNameId(cat.id)
                    setEditingNameValue(e.target.value)
                  }}
                  onBlur={() => {
                    const v = (editingNameId === cat.id ? editingNameValue : cat.name).trim()
                    if (v && v !== cat.name) updateCategory(cat.id, { name: v })
                    setEditingNameId(null)
                  }}
                  onFocus={() => {
                    setEditingNameId(cat.id)
                    setEditingNameValue(cat.name)
                  }}
                  className="flex-1 min-w-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                />
                <span className="text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cat.monthlyLimit}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!Number.isNaN(v) && v >= 0) updateCategory(cat.id, { monthlyLimit: v })
                  }}
                  className="w-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="text-red-600 dark:text-red-400 hover:underline text-sm inline-flex items-center gap-1.5"
                  title="Remove category"
                  aria-label="Remove category"
                >
                  <Trash2 className="size-4 shrink-0" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
