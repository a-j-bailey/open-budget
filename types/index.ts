export type BudgetCategoryType = 'expense' | 'income'

export interface BudgetCategory {
  id: string
  name: string
  monthlyLimit: number
  type?: BudgetCategoryType
}

export interface BudgetConfig {
  categories: BudgetCategory[]
}

export interface Rule {
  id: string
  pattern: string
  source: 'description' | 'category'
  targetCategoryId: string
}

export interface RulesConfig {
  rules: Rule[]
}

export interface ExpenseRow {
  id?: string
  transactionDate: string
  postedDate: string
  cardNo: string
  description: string
  category: string
  debit: string
  credit: string
  budgetCategoryId: string | null
  ignored: boolean
}

export interface MonthlyAggregate {
  monthKey: string
  byCategory: Record<string, number>
  total: number
  income: number
}
