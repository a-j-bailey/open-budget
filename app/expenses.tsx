import { useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { useMonth } from '../contexts/MonthContext'
import { useExpenses } from '../hooks/useExpenses'
import { useBudget } from '../hooks/useBudget'
import { useRules, applyRules } from '../hooks/useRules'

const today = () => new Date().toISOString().slice(0, 10)

export default function ExpensesScreen() {
  const { selectedMonth } = useMonth()
  const {
    expenses,
    loading,
    error,
    importAndMerge,
    updateRow,
    deleteRow,
    setAllExpenses,
    addExpense,
  } = useExpenses(selectedMonth)
  const { categories } = useBudget()
  const { rules } = useRules()

  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    transactionDate: today(),
    description: '',
    amount: '',
    isIncome: false,
    budgetCategoryId: '' as string | null,
    ignored: false,
  })

  const runImport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    })
    if (picked.canceled || picked.assets.length === 0) return
    const text = await FileSystem.readAsStringAsync(picked.assets[0].uri)
    if (!text.trim()) {
      setImportMessage('File is empty.')
      return
    }
    const { added, total } = await importAndMerge(text, rules)
    if (added === 0 && total === 0) setImportMessage('No transactions found in file.')
    else if (added === 0) setImportMessage(`No new transactions (all ${total} already imported).`)
    else setImportMessage(`Imported ${added} new transaction${added === 1 ? '' : 's'}. Total: ${total}.`)
  }

  const reapplyRules = () => {
    const validCategoryIds = new Set(categories.map((c) => c.id))
    const updated = expenses.map((row) => {
      const hasValidCategory =
        row.budgetCategoryId != null && row.budgetCategoryId !== '' && validCategoryIds.has(row.budgetCategoryId)
      if (hasValidCategory) return row
      const { budgetCategoryId, ignored } = applyRules(rules, row.description, row.category)
      return { ...row, budgetCategoryId, ignored }
    })
    setAllExpenses(updated)
  }

  const handleAddExpense = () => {
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter((row) => {
      const budgetCatName =
        (row.budgetCategoryId && categories.find((c) => c.id === row.budgetCategoryId)?.name) ?? ''
      return (
        row.description.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        String(row.debit).includes(q) ||
        budgetCatName.toLowerCase().includes(q)
      )
    })
  }, [categories, expenses, searchQuery])

  if (loading) {
    return (
      <View className="flex-1 px-4 py-4">
        <Text className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Transactions</Text>
        <Text className="mt-3 text-zinc-500 dark:text-zinc-400">Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Transactions</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={runImport} className="rounded-lg bg-blue-600 px-3 py-2">
            <Text className="text-sm font-medium text-white">Import CSV</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-green-600 px-3 py-2"
          >
            <Text className="text-sm font-medium text-white">{showAddForm ? 'Cancel' : 'Add'}</Text>
          </Pressable>
          <Pressable onPress={reapplyRules} className="rounded-lg bg-amber-600 px-3 py-2">
            <Text className="text-sm font-medium text-white">Re-apply rules</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
      {importMessage ? <Text className="mb-3 text-sm text-emerald-600">{importMessage}</Text> : null}

      {showAddForm ? (
        <View className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Add transaction</Text>
          <TextInput
            value={addForm.transactionDate}
            onChangeText={(value) => setAddForm((f) => ({ ...f, transactionDate: value }))}
            placeholder="YYYY-MM-DD"
            className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          />
          <TextInput
            value={addForm.description}
            onChangeText={(value) => setAddForm((f) => ({ ...f, description: value }))}
            placeholder="Description"
            className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          />
          <TextInput
            value={addForm.amount}
            onChangeText={(value) => setAddForm((f) => ({ ...f, amount: value }))}
            keyboardType="decimal-pad"
            placeholder="Amount"
            className="mb-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          />
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Income</Text>
            <Switch
              value={addForm.isIncome}
              onValueChange={(value) => setAddForm((f) => ({ ...f, isIncome: value }))}
            />
          </View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Ignore</Text>
            <Switch
              value={addForm.ignored}
              onValueChange={(value) => setAddForm((f) => ({ ...f, ignored: value }))}
            />
          </View>
          <Pressable onPress={handleAddExpense} className="rounded-lg bg-green-600 px-3 py-2">
            <Text className="text-center font-medium text-white">Save</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search transactions..."
        className="mb-4 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {filtered.length === 0 ? (
        <Text className="text-zinc-500 dark:text-zinc-400">No transactions yet.</Text>
      ) : (
        filtered.map((row) => {
          const index = expenses.findIndex(
            (e) =>
              e.transactionDate === row.transactionDate &&
              e.description === row.description &&
              e.debit === row.debit &&
              e.credit === row.credit
          )
          return (
            <View
              key={`${row.transactionDate}-${row.description}-${row.debit}-${row.credit}`}
              className="mb-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">{row.transactionDate}</Text>
                <Text className={`text-sm font-semibold ${(parseFloat(row.credit) || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(parseFloat(row.credit) || 0) > 0 ? '+' : '-'}$
                  {(parseFloat(row.credit) || 0) > 0 ? row.credit : row.debit}
                </Text>
              </View>
              <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.description}</Text>
              <Text className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{row.category || 'Uncategorized bank category'}</Text>

              <View className="mb-2 flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => updateRow(index, { budgetCategoryId: cat.id, ignored: false })}
                    className={`rounded-full px-3 py-1 ${
                      row.budgetCategoryId === cat.id ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <Text className={`text-xs ${row.budgetCategoryId === cat.id ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-zinc-600 dark:text-zinc-300">Ignore</Text>
                  <Switch value={row.ignored} onValueChange={(value) => updateRow(index, { ignored: value })} />
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert('Delete transaction', `Delete "${row.description}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteRow(index) },
                    ])
                  }
                >
                  <Text className="text-xs font-medium text-red-600">Delete</Text>
                </Pressable>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}
