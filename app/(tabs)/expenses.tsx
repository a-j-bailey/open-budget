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
import { Receipt } from 'lucide-react-native'
import { useMonth } from '../../contexts/MonthContext'
import { useExpenses } from '../../hooks/useExpenses'
import { useBudget } from '../../hooks/useBudget'
import { useRules, applyRules } from '../../hooks/useRules'
import { useThemeContext } from '../../contexts/ThemeContext'

const today = () => new Date().toISOString().slice(0, 10)

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

export default function ExpensesScreen() {
  const { selectedMonth } = useMonth()
  const { isDark } = useThemeContext()
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

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const inputBg = isDark ? '#292524' : '#f5f5f4'
  const segmentBg = isDark ? '#292524' : '#e7e5e4'

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: label, letterSpacing: -0.6 }}>Transactions</Text>
        <Text style={{ marginTop: 12, fontSize: 16, color: muted }}>Loading…</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: label,
          letterSpacing: -0.6,
          marginBottom: 20,
        }}
      >
        Transactions
      </Text>

      {/* Action bar: primary and secondary buttons */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <Pressable
          onPress={runImport}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: label }}>Import CSV</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowAddForm((v) => !v)}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 12,
            backgroundColor: '#10b981',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{showAddForm ? 'Cancel' : 'Add'}</Text>
        </Pressable>
        <Pressable
          onPress={reapplyRules}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: label }}>Re-apply rules</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12 }}>
          <Text selectable style={{ fontSize: 14, color: '#ef4444' }}>{error}</Text>
        </View>
      ) : null}
      {importMessage ? (
        <View style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 12 }}>
          <Text selectable style={{ fontSize: 14, color: '#10b981' }}>{importMessage}</Text>
        </View>
      ) : null}

      {/* Add transaction form card */}
      {showAddForm && (
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: border,
            marginBottom: 20,
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: label, marginBottom: 16 }}>Add transaction</Text>
          <TextInput
            value={addForm.transactionDate}
            onChangeText={(value) => setAddForm((f) => ({ ...f, transactionDate: value }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={muted}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: label,
              marginBottom: 10,
            }}
          />
          <TextInput
            value={addForm.description}
            onChangeText={(value) => setAddForm((f) => ({ ...f, description: value }))}
            placeholder="Description"
            placeholderTextColor={muted}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: label,
              marginBottom: 10,
            }}
          />
          <TextInput
            value={addForm.amount}
            onChangeText={(value) => setAddForm((f) => ({ ...f, amount: value }))}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor={muted}
            style={{
              backgroundColor: inputBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: label,
              marginBottom: 14,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 15, color: muted }}>Income</Text>
            <Switch
              value={addForm.isIncome}
              onValueChange={(value) => setAddForm((f) => ({ ...f, isIncome: value }))}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 15, color: muted }}>Ignore</Text>
            <Switch
              value={addForm.ignored}
              onValueChange={(value) => setAddForm((f) => ({ ...f, ignored: value }))}
            />
          </View>
          <Pressable
            onPress={handleAddExpense}
            style={{ backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Save</Text>
          </Pressable>
        </View>
      )}

      {/* Search bar */}
      <View
        style={{
          backgroundColor: inputBg,
          borderRadius: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: border,
        }}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions…"
          placeholderTextColor={muted}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: label,
          }}
        />
      </View>

      {/* Empty state or list */}
      {filtered.length === 0 ? (
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 20,
            padding: 32,
            borderWidth: 1,
            borderColor: border,
            alignItems: 'center',
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <View style={{ marginBottom: 16, opacity: 0.5 }}>
            <Receipt size={48} color={muted} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: label, marginBottom: 8, textAlign: 'center' }}>
            No transactions yet
          </Text>
          <Text style={{ fontSize: 15, color: muted, marginBottom: 20, textAlign: 'center' }}>
            Import a CSV or add your first transaction to get started.
          </Text>
          <Pressable
            onPress={() => setShowAddForm(true)}
            style={{ backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Add transaction</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((row) => {
            const index = expenses.findIndex(
              (e) =>
                e.transactionDate === row.transactionDate &&
                e.description === row.description &&
                e.debit === row.debit &&
                e.credit === row.credit
            )
            const isCredit = (parseFloat(row.credit) || 0) > 0
            const amountColor = isCredit ? '#16a34a' : '#dc2626'
            return (
              <View
                key={`${row.transactionDate}-${row.description}-${row.debit}-${row.credit}`}
                style={{
                  backgroundColor: bg,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: border,
                  ...(isDark ? cardShadowDark : cardShadow),
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: label, flex: 1 }} numberOfLines={2}>
                    {row.description}
                  </Text>
                  <Text
                    selectable
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: amountColor,
                      fontVariant: ['tabular-nums'],
                      marginLeft: 12,
                    }}
                  >
                    {isCredit ? '+' : '-'}${isCredit ? row.credit : row.debit}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
                  {row.transactionDate} · {row.category || 'Uncategorized'}
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => updateRow(index, { budgetCategoryId: cat.id, ignored: false })}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: row.budgetCategoryId === cat.id ? '#0ea5e9' : segmentBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: row.budgetCategoryId === cat.id ? '#fff' : label,
                        }}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, color: muted }}>Ignore</Text>
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
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}
