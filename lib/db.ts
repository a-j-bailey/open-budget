import * as SQLite from 'expo-sqlite'
import type { BudgetCategory, ExpenseRow, Rule } from '../types'

const dbPromise = SQLite.openDatabaseAsync('household-budget.db')

function toDbInt(value: boolean): number {
  return value ? 1 : 0
}

function fromDbInt(value: number): boolean {
  return value === 1
}

export async function initDb() {
  const db = await dbPromise
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS budget_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      monthly_limit REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('description', 'category')),
      target_category_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      transaction_date TEXT NOT NULL,
      posted_date TEXT NOT NULL,
      card_no TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      debit TEXT NOT NULL DEFAULT '0',
      credit TEXT NOT NULL DEFAULT '0',
      budget_category_id TEXT,
      ignored INTEGER NOT NULL DEFAULT 0,
      month_key TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month_key);
  `)
}

export async function getCategories(): Promise<BudgetCategory[]> {
  const db = await dbPromise
  return db.getAllAsync<BudgetCategory>(
    'SELECT id, name, monthly_limit as monthlyLimit, type FROM budget_categories ORDER BY name ASC'
  )
}

export async function insertCategory(category: BudgetCategory) {
  const db = await dbPromise
  await db.runAsync(
    'INSERT INTO budget_categories (id, name, monthly_limit, type) VALUES (?, ?, ?, ?)',
    [category.id, category.name, category.monthlyLimit, category.type ?? 'expense']
  )
}

export async function replaceCategories(categories: BudgetCategory[]) {
  const db = await dbPromise
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM budget_categories')
    for (const category of categories) {
      await db.runAsync(
        'INSERT INTO budget_categories (id, name, monthly_limit, type) VALUES (?, ?, ?, ?)',
        [category.id, category.name, category.monthlyLimit, category.type ?? 'expense']
      )
    }
  })
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'type'>>
) {
  const db = await dbPromise
  const existing = await db.getFirstAsync<BudgetCategory>(
    'SELECT id, name, monthly_limit as monthlyLimit, type FROM budget_categories WHERE id = ?',
    [id]
  )
  if (!existing) return
  await db.runAsync(
    'UPDATE budget_categories SET name = ?, monthly_limit = ?, type = ? WHERE id = ?',
    [
      updates.name ?? existing.name,
      updates.monthlyLimit ?? existing.monthlyLimit,
      updates.type ?? existing.type ?? 'expense',
      id,
    ]
  )
}

export async function deleteCategory(id: string) {
  const db = await dbPromise
  await db.runAsync('DELETE FROM budget_categories WHERE id = ?', [id])
}

export async function getRules(): Promise<Rule[]> {
  const db = await dbPromise
  return db.getAllAsync<Rule>(
    'SELECT id, pattern, source, target_category_id as targetCategoryId FROM rules ORDER BY rowid ASC'
  )
}

export async function insertRule(rule: Rule) {
  const db = await dbPromise
  await db.runAsync(
    'INSERT INTO rules (id, pattern, source, target_category_id) VALUES (?, ?, ?, ?)',
    [rule.id, rule.pattern, rule.source, rule.targetCategoryId]
  )
}

export async function replaceRules(rules: Rule[]) {
  const db = await dbPromise
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM rules')
    for (const rule of rules) {
      await db.runAsync(
        'INSERT INTO rules (id, pattern, source, target_category_id) VALUES (?, ?, ?, ?)',
        [rule.id, rule.pattern, rule.source, rule.targetCategoryId]
      )
    }
  })
}

export async function updateRule(id: string, updates: Partial<Omit<Rule, 'id'>>) {
  const db = await dbPromise
  const existing = await db.getFirstAsync<Rule>(
    'SELECT id, pattern, source, target_category_id as targetCategoryId FROM rules WHERE id = ?',
    [id]
  )
  if (!existing) return
  await db.runAsync(
    'UPDATE rules SET pattern = ?, source = ?, target_category_id = ? WHERE id = ?',
    [
      updates.pattern ?? existing.pattern,
      updates.source ?? existing.source,
      updates.targetCategoryId ?? existing.targetCategoryId,
      id,
    ]
  )
}

export async function deleteRule(id: string) {
  const db = await dbPromise
  await db.runAsync('DELETE FROM rules WHERE id = ?', [id])
}

type ExpenseRecord = {
  id: string
  transactionDate: string
  postedDate: string
  cardNo: string
  description: string
  category: string
  debit: string
  credit: string
  budgetCategoryId: string | null
  ignored: number
  monthKey: string
}

function toExpenseRow(record: ExpenseRecord): ExpenseRow {
  return {
    id: record.id,
    transactionDate: record.transactionDate,
    postedDate: record.postedDate,
    cardNo: record.cardNo,
    description: record.description,
    category: record.category,
    debit: record.debit,
    credit: record.credit,
    budgetCategoryId: record.budgetCategoryId,
    ignored: fromDbInt(record.ignored),
  }
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

export async function getExpensesByMonth(selectedMonth: string): Promise<ExpenseRow[]> {
  const db = await dbPromise
  const rows = await db.getAllAsync<ExpenseRecord>(
    `SELECT
      id,
      transaction_date as transactionDate,
      posted_date as postedDate,
      card_no as cardNo,
      description,
      category,
      debit,
      credit,
      budget_category_id as budgetCategoryId,
      ignored,
      month_key as monthKey
     FROM expenses
     WHERE month_key = ?
     ORDER BY transaction_date DESC, rowid DESC`,
    [selectedMonth]
  )
  return rows.map(toExpenseRow)
}

export async function getAllExpenses(): Promise<ExpenseRow[]> {
  const db = await dbPromise
  const rows = await db.getAllAsync<ExpenseRecord>(
    `SELECT
      id,
      transaction_date as transactionDate,
      posted_date as postedDate,
      card_no as cardNo,
      description,
      category,
      debit,
      credit,
      budget_category_id as budgetCategoryId,
      ignored,
      month_key as monthKey
     FROM expenses
     ORDER BY transaction_date DESC, rowid DESC`
  )
  return rows.map(toExpenseRow)
}

export async function listExpenseMonths(): Promise<string[]> {
  const db = await dbPromise
  const rows = await db.getAllAsync<{ monthKey: string }>(
    'SELECT DISTINCT month_key as monthKey FROM expenses ORDER BY month_key ASC'
  )
  return rows.map((r) => r.monthKey)
}

export async function replaceExpensesForMonth(selectedMonth: string, rows: ExpenseRow[]) {
  const db = await dbPromise
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM expenses WHERE month_key = ?', [selectedMonth])
    for (const row of rows) {
      const id = row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      await db.runAsync(
        `INSERT INTO expenses (
          id, transaction_date, posted_date, card_no, description, category, debit, credit, budget_category_id, ignored, month_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          row.transactionDate,
          row.postedDate,
          row.cardNo,
          row.description,
          row.category,
          row.debit,
          row.credit,
          row.budgetCategoryId,
          toDbInt(row.ignored),
          selectedMonth,
        ]
      )
    }
  })
}

export async function replaceAllExpenses(rows: ExpenseRow[]) {
  const db = await dbPromise
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM expenses')
    for (const row of rows) {
      const id = row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      await db.runAsync(
        `INSERT INTO expenses (
          id, transaction_date, posted_date, card_no, description, category, debit, credit, budget_category_id, ignored, month_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          row.transactionDate,
          row.postedDate,
          row.cardNo,
          row.description,
          row.category,
          row.debit,
          row.credit,
          row.budgetCategoryId,
          toDbInt(row.ignored),
          monthKey(row.transactionDate),
        ]
      )
    }
  })
}

export async function upsertExpense(row: ExpenseRow) {
  const db = await dbPromise
  const id = row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses (
      id, transaction_date, posted_date, card_no, description, category, debit, credit, budget_category_id, ignored, month_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      row.transactionDate,
      row.postedDate,
      row.cardNo,
      row.description,
      row.category,
      row.debit,
      row.credit,
      row.budgetCategoryId,
      toDbInt(row.ignored),
      monthKey(row.transactionDate),
    ]
  )
}

export async function clearAllData() {
  const db = await dbPromise
  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM rules;
    DELETE FROM budget_categories;
  `)
}
