import Papa from 'papaparse'
import type { ExpenseRow } from '../types'

const CSV_HEADERS = [
  'Transaction Date',
  'Posted Date',
  'Card No.',
  'Description',
  'Category',
  'Debit',
  'Credit',
  'Budget Category',
  'Ignored',
] as const

function safeStr(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function parseNum(v: string): string {
  const cleaned = v.replace(/[,$]/g, '').trim()
  return cleaned || '0'
}

/** Normalize date to YYYY-MM-DD for month filter. Handles MM/DD/YY, MM/DD/YYYY, and already YYYY-MM-DD. */
function normalizeTransactionDate(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // MM/DD/YY or MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    const month = m[1].padStart(2, '0')
    const day = m[2].padStart(2, '0')
    let year = m[3]
    if (year.length === 2) {
      const n = parseInt(year, 10)
      year = n >= 0 && n <= 50 ? `20${year}` : `19${year}`
    }
    return `${year}-${month}-${day}`
  }
  return s
}

export interface ParsedCSVRow {
  transactionDate: string
  postedDate: string
  cardNo: string
  description: string
  category: string
  debit: string
  credit: string
  budgetCategoryId?: string | null
  ignored?: boolean
}

function stripBOM(s: string): string {
  if (s.charCodeAt(0) === 0xfeff) return s.slice(1)
  return s
}

export function parseCSVToExpenses(csvContent: string): ExpenseRow[] {
  const normalized = stripBOM(csvContent.trim())
  const parsed = Papa.parse<Record<string, string>>(normalized, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length) {
    console.warn('CSV parse errors:', parsed.errors)
  }
  const rows: ExpenseRow[] = []
  const first = parsed.data[0] as Record<string, string> | undefined
  const keys = first ? Object.keys(first) : []
  const get = (row: Record<string, string>, ...names: string[]): string => {
    for (const n of names) {
      const v = row[n]
      if (v !== undefined && v !== '') return v
    }
    const want = names[0]?.toLowerCase()
    for (const k of keys) {
      if (k.trim().toLowerCase() === want) return row[k] ?? ''
    }
    return ''
  }
  for (const row of parsed.data) {
    const r = row as Record<string, string>
    const rawDate = safeStr(get(r, 'Transaction Date', 'transactionDate'))
    const transactionDate = normalizeTransactionDate(rawDate)
    const postedDate = safeStr(get(r, 'Posted Date', 'postedDate')) || transactionDate
    const cardNo = safeStr(get(r, 'Card No.', 'cardNo'))
    const description = safeStr(get(r, 'Description', 'description') || get(r, 'Transaction Description', 'transactionDescription'))
    const category = safeStr(get(r, 'Category', 'category'))
    // Bank format: "Transaction Type" (Debit/Credit) + "Transaction Amount"
    const txType = safeStr(get(r, 'Transaction Type', 'transactionType')).toLowerCase()
    const txAmount = parseNum(safeStr(get(r, 'Transaction Amount', 'transactionAmount')))
    let debit = safeStr(get(r, 'Debit', 'debit'))
    let credit = safeStr(get(r, 'Credit', 'credit'))
    if (txAmount !== '0' && (debit === '' || debit === '0') && (credit === '' || credit === '0')) {
      if (txType === 'debit') debit = txAmount
      else if (txType === 'credit') credit = txAmount
    }
    debit = parseNum(debit)
    credit = parseNum(credit)
    const budgetCategoryVal = get(r, 'Budget Category', 'budgetCategory')
    const budgetCategoryId = budgetCategoryVal.trim() ? safeStr(budgetCategoryVal) : null
    const ignoredRaw = safeStr(get(r, 'Ignored', 'ignored')).toLowerCase()
    const ignored = ignoredRaw === 'yes' || ignoredRaw === 'true' || ignoredRaw === '1'

    rows.push({
      transactionDate,
      postedDate,
      cardNo,
      description,
      category,
      debit,
      credit,
      budgetCategoryId: budgetCategoryId || null,
      ignored,
    })
  }
  return rows
}

export function expenseRowToCSVLine(row: ExpenseRow): string {
  const cells = [
    row.transactionDate,
    row.postedDate,
    row.cardNo,
    row.description,
    row.category,
    row.debit,
    row.credit,
    row.budgetCategoryId ?? '',
    row.ignored ? 'yes' : 'no',
  ]
  return cells.map((c) => (c.includes(',') || c.includes('"') ? `"${String(c).replace(/"/g, '""')}"` : c)).join(',')
}

export function expensesToCSV(rows: ExpenseRow[]): string {
  const header = CSV_HEADERS.join(',')
  const lines = rows.map(expenseRowToCSVLine)
  return [header, ...lines].join('\n')
}
