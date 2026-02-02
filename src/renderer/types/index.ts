export type BudgetCategoryType = 'expense' | 'income'

export interface BudgetCategory {
  id: string
  name: string
  monthlyLimit: number
  /** Defaults to 'expense' when omitted (backward compatible). */
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
  /** Sum of debits (outflows) for the month, excluding ignored rows. */
  total: number
  /** Sum of credits (inflows) for the month, excluding ignored rows. */
  income: number
}

declare global {
  interface Window {
    electron: {
      readConfig: () => Promise<string | null>
      writeConfig: (content: string) => Promise<void>
      readRules: () => Promise<string | null>
      writeRules: (content: string) => Promise<void>
      listExpenseMonths: () => Promise<string[]>
      readExpenses: (month?: string) => Promise<string | null>
      writeExpenses: (month: string | null, content: string) => Promise<void>
      removeLegacyExpenses: () => Promise<void>
      getDataDir: () => Promise<string>
      openDataDir: () => Promise<void>
      showOpenDialog: () => Promise<string | null>
    }
  }
}
