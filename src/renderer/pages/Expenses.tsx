import { useRef, useState, useMemo, useEffect } from 'react'
import { Upload, Plus, X, RefreshCw, Trash2, Wand2, ChevronDown, ChevronRight, Check, XCircle } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { useBudget } from '../hooks/useBudget'
import { useRules, applyRules } from '../hooks/useRules'
import { useMonth } from '../MonthContext'
import type { ExpenseRow } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

export default function Expenses() {
  const { selectedMonth } = useMonth()
  const { expenses, loading, error, importAndMerge, updateRow, bulkUpdateRows, deleteRow, bulkDeleteRows, setAllExpenses, addExpense } =
    useExpenses(selectedMonth)
  const { categories } = useBudget()
  const { rules, addRule } = useRules()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    transactionDate: today(),
    description: '',
    amount: '',
    isIncome: false,
    budgetCategoryId: '' as string | null,
    ignored: false,
  })
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [bulkCategory, setBulkCategory] = useState<string>('')
  const [bulkIgnored, setBulkIgnored] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  const ignoredHeaderCheckboxRef = useRef<HTMLInputElement>(null)
  const [createRuleRow, setCreateRuleRow] = useState<ExpenseRow | null>(null)
  const [ruleForm, setRuleForm] = useState<{
    pattern: string
    source: 'description' | 'category'
    targetCategoryId: string
  }>({ pattern: '', source: 'description', targetCategoryId: 'ignore' })
  const [ignoredSectionExpanded, setIgnoredSectionExpanded] = useState(false)

  const runImport = async (text: string) => {
    setImportMessage(null)
    setImporting(true)
    try {
      const { added, total } = await importAndMerge(text, rules)
      if (added === 0 && total === 0) {
        setImportMessage({ type: 'error', text: 'No transactions found in file. Check that the CSV has headers: Transaction Date, Description, Debit, etc.' })
      } else if (added === 0) {
        setImportMessage({ type: 'success', text: `No new transactions (all ${total} already imported).` })
      } else {
        setImportMessage({ type: 'success', text: `Imported ${added} new transaction${added === 1 ? '' : 's'}. Total: ${total}.` })
      }
      setTimeout(() => setImportMessage(null), 5000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed'
      setImportMessage({ type: 'error', text: msg })
    } finally {
      setImporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    if (text?.trim()) await runImport(text)
    else setImportMessage({ type: 'error', text: 'File is empty.' })
  }


  const handleReapplyRules = () => {
    const updated = expenses.map((row) => {
      if (row.budgetCategoryId != null && row.budgetCategoryId !== '') {
        return row
      }
      const { budgetCategoryId, ignored } = applyRules(rules, row.description, row.category)
      return { ...row, budgetCategoryId, ignored }
    })
    setAllExpenses(updated)
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.description.trim() || !addForm.amount.trim()) return
    addExpense(
      {
        transactionDate: addForm.transactionDate,
        description: addForm.description.trim(),
        debit: addForm.isIncome ? '0' : addForm.amount.trim(),
        credit: addForm.isIncome ? addForm.amount.trim() : '0',
        budgetCategoryId: addForm.budgetCategoryId === '' ? null : addForm.budgetCategoryId,
        ignored: addForm.ignored,
      },
      rules
    )
    setAddForm({
      transactionDate: today(),
      description: '',
      amount: '',
      isIncome: false,
      budgetCategoryId: '',
      ignored: false,
    })
    setShowAddForm(false)
  }

  const expenseRows = useMemo(() => {
    // Include both outflows (debit > 0) and inflows (credit > 0)
    const rows = expenses.filter((row) => {
      const debit = parseFloat(row.debit) || 0
      const credit = parseFloat(row.credit) || 0
      return debit > 0 || credit > 0
    })
    const isUncategorizedNotIgnored = (r: (typeof rows)[0]) =>
      (r.budgetCategoryId == null || r.budgetCategoryId === '') && !r.ignored
    return rows.sort((a, b) => {
      const aFirst = isUncategorizedNotIgnored(a)
      const bFirst = isUncategorizedNotIgnored(b)
      if (aFirst && !bFirst) return -1
      if (!aFirst && bFirst) return 1
      return (b.transactionDate || '').localeCompare(a.transactionDate || '')
    })
  }, [expenses])

  const filteredExpenseRows = useMemo(() => {
    let rows = expenseRows
    if (filterCategoryId === '__uncategorized__') {
      rows = rows.filter((row) => row.budgetCategoryId == null || row.budgetCategoryId === '')
    } else if (filterCategoryId !== '') {
      rows = rows.filter((row) => row.budgetCategoryId === filterCategoryId)
    }
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const desc = (row.description ?? '').toLowerCase()
      const cat = (row.category ?? '').toLowerCase()
      const debit = (row.debit ?? '').toLowerCase()
      const budgetCatName =
        (row.budgetCategoryId && categories.find((c) => c.id === row.budgetCategoryId)?.name) ?? ''
      const budgetCat = budgetCatName.toLowerCase()
      return desc.includes(q) || cat.includes(q) || debit.includes(q) || budgetCat.includes(q)
    })
  }, [expenseRows, searchQuery, filterCategoryId, categories])

  const primaryRows = useMemo(
    () => filteredExpenseRows.filter((row) => !row.ignored),
    [filteredExpenseRows]
  )
  const ignoredRows = useMemo(
    () => filteredExpenseRows.filter((row) => row.ignored),
    [filteredExpenseRows]
  )

  const primaryVisibleGlobalIndices = useMemo(
    () =>
      primaryRows
        .map((row) =>
          expenses.findIndex(
            (e) =>
              e.transactionDate === row.transactionDate &&
              e.description === row.description &&
              e.debit === row.debit &&
              e.credit === row.credit
          )
        )
        .filter((i) => i >= 0),
    [primaryRows, expenses]
  )
  const ignoredVisibleGlobalIndices = useMemo(
    () =>
      ignoredRows
        .map((row) =>
          expenses.findIndex(
            (e) =>
              e.transactionDate === row.transactionDate &&
              e.description === row.description &&
              e.debit === row.debit &&
              e.credit === row.credit
          )
        )
        .filter((i) => i >= 0),
    [ignoredRows, expenses]
  )

  const tableSummary = useMemo(() => {
    const count = primaryRows.length
    let debitTotal = 0
    let creditTotal = 0
    for (const row of primaryRows) {
      debitTotal += parseFloat(row.debit) || 0
      creditTotal += parseFloat(row.credit) || 0
    }
    const net = debitTotal - creditTotal
    return { count, debitTotal, creditTotal, net }
  }, [primaryRows])

  const toggleSelection = (globalIndex: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(globalIndex)) next.delete(globalIndex)
      else next.add(globalIndex)
      return next
    })
  }

  const allVisibleSelected =
    primaryVisibleGlobalIndices.length > 0 &&
    primaryVisibleGlobalIndices.every((i) => selectedIndices.has(i))
  const someVisibleSelected = primaryVisibleGlobalIndices.some((i) => selectedIndices.has(i))

  const toggleSelectAllOnPage = () => {
    if (allVisibleSelected) setSelectedIndices(new Set())
    else setSelectedIndices(new Set(primaryVisibleGlobalIndices))
  }

  const allIgnoredVisibleSelected =
    ignoredVisibleGlobalIndices.length > 0 &&
    ignoredVisibleGlobalIndices.every((i) => selectedIndices.has(i))
  const someIgnoredVisibleSelected = ignoredVisibleGlobalIndices.some((i) => selectedIndices.has(i))

  const toggleSelectAllIgnored = () => {
    if (allIgnoredVisibleSelected) {
      setSelectedIndices((prev) => {
        const next = new Set(prev)
        ignoredVisibleGlobalIndices.forEach((i) => next.delete(i))
        return next
      })
    } else {
      setSelectedIndices((prev) => {
        const next = new Set(prev)
        ignoredVisibleGlobalIndices.forEach((i) => next.add(i))
        return next
      })
    }
  }

  useEffect(() => {
    const el = headerCheckboxRef.current
    if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected
  }, [someVisibleSelected, allVisibleSelected])

  useEffect(() => {
    const el = ignoredHeaderCheckboxRef.current
    if (el) el.indeterminate = someIgnoredVisibleSelected && !allIgnoredVisibleSelected
  }, [someIgnoredVisibleSelected, allIgnoredVisibleSelected])

  const handleBulkApply = () => {
    bulkUpdateRows(Array.from(selectedIndices), {
      budgetCategoryId: bulkCategory === '' ? null : bulkCategory,
      ignored: bulkIgnored,
    })
    setSelectedIndices(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedIndices.size === 0) return
    if (!window.confirm(`Delete ${selectedIndices.size} transaction${selectedIndices.size === 1 ? '' : 's'}? This cannot be undone.`)) return
    bulkDeleteRows(Array.from(selectedIndices))
    setSelectedIndices(new Set())
  }

  const openCreateRuleDialog = (row: ExpenseRow) => {
    setCreateRuleRow(row)
    setRuleForm({
      pattern: row.description ?? '',
      source: 'description',
      targetCategoryId: row.budgetCategoryId ?? 'ignore',
    })
  }

  const closeCreateRuleDialog = () => {
    setCreateRuleRow(null)
  }

  const handleSaveRuleFromExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const p = ruleForm.pattern.trim()
    if (!p) return
    addRule({
      pattern: p,
      source: ruleForm.source,
      targetCategoryId: ruleForm.targetCategoryId === 'ignore' ? 'ignore' : ruleForm.targetCategoryId,
    })
    closeCreateRuleDialog()
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-4">Transactions</h1>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            title="Import CSV"
            aria-label="Import CSV"
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="size-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            title={showAddForm ? 'Cancel' : 'Add transaction'}
            aria-label={showAddForm ? 'Cancel' : 'Add transaction'}
            className={`p-2.5 rounded-lg transition-colors ${
              showAddForm
                ? 'bg-gray-500 text-white hover:bg-gray-600'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {showAddForm ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
          {rules.length > 0 && (
            <button
              type="button"
              onClick={handleReapplyRules}
              title="Re-apply rules"
              aria-label="Re-apply rules"
              className="p-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <RefreshCw className="size-5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
      {importMessage && (
        <p
          className={`mb-4 text-sm ${
            importMessage.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {importMessage.text}
        </p>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddExpense}
          className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Add transaction
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={addForm.transactionDate}
                onChange={(e) => setAddForm((f) => ({ ...f, transactionDate: e.target.value }))}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Groceries"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Amount
              </label>
              <input
                type="text"
                required
                inputMode="decimal"
                value={addForm.amount}
                onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-transaction-income"
                checked={addForm.isIncome}
                onChange={(e) => setAddForm((f) => ({ ...f, isIncome: e.target.checked }))}
                className="rounded"
              />
              <label
                htmlFor="add-transaction-income"
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Income
              </label>
            </div>
            <div className="min-w-[120px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Budget category
              </label>
              <select
                value={addForm.budgetCategoryId ?? ''}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    budgetCategoryId: e.target.value === '' ? null : e.target.value,
                  }))
                }
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm w-full"
              >
                <option value="">—</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-transaction-ignored"
                checked={addForm.ignored}
                onChange={(e) => setAddForm((f) => ({ ...f, ignored: e.target.checked }))}
                className="rounded"
              />
              <label
                htmlFor="add-transaction-ignored"
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Ignore
              </label>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2"
            >
              <Check className="size-4 shrink-0" />
              Save
            </button>
          </div>
        </form>
      )}

      {selectedIndices.size > 0 && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedIndices.size} selected
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Budget category:
            </label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm min-w-[140px]"
            >
              <option value="">—</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bulk-ignored"
              checked={bulkIgnored}
              onChange={(e) => setBulkIgnored(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="bulk-ignored"
              className="text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Ignore
            </label>
          </div>
          <button
            type="button"
            onClick={handleBulkApply}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2"
          >
            <Check className="size-4 shrink-0" />
            Apply to selected
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium inline-flex items-center gap-2"
          >
            <Trash2 className="size-4 shrink-0" />
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelectedIndices(new Set())}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium inline-flex items-center gap-2"
          >
            <XCircle className="size-4 shrink-0" />
            Clear selection
          </button>
        </div>
      )}

      {expenseRows.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="transaction-search" className="sr-only">
            Search transactions
          </label>
          <input
            id="transaction-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description, category, amount…"
            className="w-full max-w-md rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400"
            aria-label="Search transactions"
          />
          <label htmlFor="transaction-filter-category" className="sr-only">
            Filter by budget category
          </label>
          <select
            id="transaction-filter-category"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[160px]"
            aria-label="Filter by budget category"
          >
            <option value="">All categories</option>
            <option value="__uncategorized__">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {expenseRows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No transactions yet. Import a CSV to get started.
        </p>
      ) : primaryRows.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No transactions match your filters. Try a different category or search term.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="w-10 py-2 px-2">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllOnPage}
                    className="rounded"
                    title={allVisibleSelected ? 'Clear selection' : 'Select all on page'}
                  />
                </th>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Description</th>
                <th className="text-left py-2 px-2">Bank category</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Budget category</th>
                <th className="text-left py-2 px-2">Ignore</th>
                <th className="w-10 py-2 px-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {primaryRows.map((row) => {
                const globalIndex = expenses.findIndex(
                  (e) =>
                    e.transactionDate === row.transactionDate &&
                    e.description === row.description &&
                    e.debit === row.debit &&
                    e.credit === row.credit
                )
                if (globalIndex < 0) return null
                return (
                  <tr key={`${row.transactionDate}-${row.description}-${row.debit}-${row.credit}`} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="w-10 py-1.5 px-2">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(globalIndex)}
                        onChange={() => toggleSelection(globalIndex)}
                        className="rounded"
                        aria-label="Select row"
                      />
                    </td>
                    <td className="py-1.5 px-2 whitespace-nowrap">{row.transactionDate}</td>
                    <td className="py-1.5 px-2 max-w-[200px] truncate" title={row.description}>
                      {row.description}
                    </td>
                    <td className="py-1.5 px-2 text-gray-500 dark:text-gray-400">{row.category}</td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {(() => {
                        const debit = parseFloat(row.debit) || 0
                        const credit = parseFloat(row.credit) || 0
                        if (debit > 0) {
                          return (
                            <span className="text-red-600 dark:text-red-400">
                              −${row.debit}
                            </span>
                          )
                        }
                        if (credit > 0) {
                          return (
                            <span className="text-green-600 dark:text-green-400">
                              ${row.credit}
                            </span>
                          )
                        }
                        return '—'
                      })()}
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={row.budgetCategoryId ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updateRow(globalIndex, {
                            budgetCategoryId: v === '' ? null : v,
                            ignored: v === '' ? row.ignored : false,
                          })
                        }}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm min-w-[120px]"
                      >
                        <option value="">—</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="checkbox"
                        checked={row.ignored}
                        onChange={(e) => updateRow(globalIndex, { ignored: e.target.checked })}
                        className="rounded"
                      />
                    </td>
                    <td className="py-1.5 px-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openCreateRuleDialog(row)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title="Create rule from this transaction"
                        aria-label="Create rule from this transaction"
                      >
                        <Wand2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amount = (parseFloat(row.debit) || 0) > 0 ? row.debit : row.credit
                        if (window.confirm(`Delete "${row.description}" (${row.transactionDate}, $${amount})?`)) {
                            deleteRow(globalIndex)
                          }
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-medium">
                <td className="py-2 px-2" colSpan={4}>
                  {tableSummary.count} transaction{tableSummary.count === 1 ? '' : 's'}
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  {tableSummary.net > 0 ? (
                    <span className="text-red-600 dark:text-red-400">−${tableSummary.net.toFixed(2)}</span>
                  ) : tableSummary.net < 0 ? (
                    <span className="text-green-600 dark:text-green-400">+${Math.abs(tableSummary.net).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">$0.00</span>
                  )}
                </td>
                <td className="py-2 px-2" colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {ignoredRows.length > 0 && (
        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIgnoredSectionExpanded((v) => !v)}
            className="w-full flex items-center gap-2 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
            aria-expanded={ignoredSectionExpanded}
          >
            {ignoredSectionExpanded ? (
              <ChevronDown className="size-4 shrink-0" />
            ) : (
              <ChevronRight className="size-4 shrink-0" />
            )}
            Ignored transactions ({ignoredRows.length})
          </button>
          {ignoredSectionExpanded && (
            <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="w-10 py-2 px-2">
                      <input
                        ref={ignoredHeaderCheckboxRef}
                        type="checkbox"
                        checked={allIgnoredVisibleSelected}
                        onChange={toggleSelectAllIgnored}
                        className="rounded"
                        title={allIgnoredVisibleSelected ? 'Clear selection' : 'Select all ignored'}
                      />
                    </th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Bank category</th>
                    <th className="text-right py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Budget category</th>
                    <th className="text-left py-2 px-2">Ignore</th>
                    <th className="w-10 py-2 px-2" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {ignoredRows.map((row) => {
                    const globalIndex = expenses.findIndex(
                      (e) =>
                        e.transactionDate === row.transactionDate &&
                        e.description === row.description &&
                        e.debit === row.debit &&
                        e.credit === row.credit
                    )
                    if (globalIndex < 0) return null
                    return (
                      <tr key={`${row.transactionDate}-${row.description}-${row.debit}-${row.credit}`} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="w-10 py-1.5 px-2">
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(globalIndex)}
                            onChange={() => toggleSelection(globalIndex)}
                            className="rounded"
                            aria-label="Select row"
                          />
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">{row.transactionDate}</td>
                        <td className="py-1.5 px-2 max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="py-1.5 px-2 text-gray-500 dark:text-gray-400">{row.category}</td>
                        <td className="py-1.5 px-2 text-right font-mono">
                          {(() => {
                            const debit = parseFloat(row.debit) || 0
                            const credit = parseFloat(row.credit) || 0
                            if (debit > 0) {
                              return (
                                <span className="text-red-600 dark:text-red-400">
                                  −${row.debit}
                                </span>
                              )
                            }
                            if (credit > 0) {
                              return (
                                <span className="text-green-600 dark:text-green-400">
                                  ${row.credit}
                                </span>
                              )
                            }
                            return '—'
                          })()}
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={row.budgetCategoryId ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              updateRow(globalIndex, {
                                budgetCategoryId: v === '' ? null : v,
                                ignored: v === '' ? row.ignored : false,
                              })
                            }}
                            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm min-w-[120px]"
                          >
                            <option value="">—</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="checkbox"
                            checked={row.ignored}
                            onChange={(e) => updateRow(globalIndex, { ignored: e.target.checked })}
                            className="rounded"
                          />
                        </td>
                        <td className="py-1.5 px-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openCreateRuleDialog(row)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title="Create rule from this transaction"
                            aria-label="Create rule from this transaction"
                          >
                            <Wand2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const amount = (parseFloat(row.debit) || 0) > 0 ? row.debit : row.credit
                              if (window.confirm(`Delete "${row.description}" (${row.transactionDate}, $${amount})?`)) {
                                deleteRow(globalIndex)
                              }
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {createRuleRow != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-rule-dialog-title"
          onClick={closeCreateRuleDialog}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-rule-dialog-title" className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700">
              Create rule from transaction
            </h2>
            <form onSubmit={handleSaveRuleFromExpense} className="p-4 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A rule will match future transactions. Adjust the pattern and target category below.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pattern
                </label>
                <input
                  type="text"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm((f) => ({ ...f, pattern: e.target.value }))}
                  placeholder="e.g. Audible or /^AMZN/"
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Match
                </label>
                <select
                  value={ruleForm.source}
                  onChange={(e) => setRuleForm((f) => ({ ...f, source: e.target.value as 'description' | 'category' }))}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="description">Description</option>
                  <option value="category">Bank category</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Then assign to
                </label>
                <select
                  value={ruleForm.targetCategoryId}
                  onChange={(e) => setRuleForm((f) => ({ ...f, targetCategoryId: e.target.value }))}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="ignore">Ignore</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateRuleDialog}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium inline-flex items-center gap-2"
                >
                  <X className="size-4 shrink-0" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!ruleForm.pattern.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium inline-flex items-center gap-2"
                >
                  <Check className="size-4 shrink-0" />
                  Save rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
