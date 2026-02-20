import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { Receipt } from 'lucide-react-native'
import type { ExpenseRow } from '../../types'
import { useMonth } from '../../contexts/MonthContext'
import { useExpenses } from '../../hooks/useExpenses'
import { useBudget } from '../../hooks/useBudget'
import { useRules, applyRules } from '../../hooks/useRules'
import { useThemeContext } from '../../contexts/ThemeContext'

const today = () => new Date().toISOString().slice(0, 10)

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    transactionDate: '',
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
    const file = new File(picked.assets[0].uri)
    const text = await file.text()
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

  const openEditSheet = useCallback((row: ExpenseRow) => {
    const idx = expenses.findIndex(
      (e) =>
        e.transactionDate === row.transactionDate &&
        e.description === row.description &&
        e.debit === row.debit &&
        e.credit === row.credit
    )
    if (idx < 0) return
    const isCredit = (parseFloat(row.credit) || 0) > 0
    const amount = isCredit ? row.credit : row.debit
    setEditForm({
      transactionDate: row.transactionDate,
      description: row.description,
      amount,
      isIncome: isCredit,
      budgetCategoryId: row.budgetCategoryId ?? '',
      ignored: row.ignored,
    })
    setEditingIndex(idx)
  }, [expenses])

  const handleSaveEdit = useCallback(() => {
    if (editingIndex == null || !editForm.description.trim() || !editForm.amount.trim()) return
    const next = expenses.map((row, i) => {
      if (i !== editingIndex) return row
      return {
        ...row,
        transactionDate: editForm.transactionDate.trim(),
        description: editForm.description.trim(),
        debit: editForm.isIncome ? '0' : editForm.amount.trim().replace(/[,$]/g, ''),
        credit: editForm.isIncome ? editForm.amount.trim().replace(/[,$]/g, '') : '0',
        budgetCategoryId: editForm.budgetCategoryId === '' ? null : editForm.budgetCategoryId,
        ignored: editForm.ignored,
      }
    })
    setAllExpenses(next)
    setEditingIndex(null)
  }, [editingIndex, editForm, expenses, setAllExpenses])

  const handleDeleteFromEdit = useCallback(() => {
    if (editingIndex == null) return
    deleteRow(editingIndex)
    setEditingIndex(null)
  }, [editingIndex, deleteRow])

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
      <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: label, letterSpacing: -0.6 }}>Transactions</Text>
        <Text style={{ marginTop: 10, fontSize: 16, color: muted }}>Loading…</Text>
      </View>
    )
  }

  return (
    <>
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: label,
          letterSpacing: -0.6,
          marginBottom: 14,
        }}
      >
        Transactions
      </Text>

      {/* Action bar: primary and secondary buttons */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Pressable
          onPress={runImport}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
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
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: '#10b981',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{showAddForm ? 'Cancel' : 'Add'}</Text>
        </Pressable>
        <Pressable
          onPress={reapplyRules}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: label }}>Re-apply rules</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={{ marginBottom: 10, padding: 10, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10 }}>
          <Text selectable style={{ fontSize: 14, color: '#ef4444' }}>{error}</Text>
        </View>
      ) : null}
      {importMessage ? (
        <View style={{ marginBottom: 10, padding: 10, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: 10 }}>
          <Text selectable style={{ fontSize: 14, color: '#10b981' }}>{importMessage}</Text>
        </View>
      ) : null}

      {/* Add transaction form card */}
      {showAddForm && (
        <View
          style={{
            backgroundColor: bg,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: border,
            marginBottom: 14,
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: label, marginBottom: 12 }}>Add transaction</Text>
          <TextInput
            value={addForm.transactionDate}
            onChangeText={(value) => setAddForm((f) => ({ ...f, transactionDate: value }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={muted}
            style={{
              backgroundColor: inputBg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: label,
              marginBottom: 8,
            }}
          />
          <TextInput
            value={addForm.description}
            onChangeText={(value) => setAddForm((f) => ({ ...f, description: value }))}
            placeholder="Description"
            placeholderTextColor={muted}
            style={{
              backgroundColor: inputBg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: label,
              marginBottom: 8,
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
              borderRadius: 10,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: label,
              marginBottom: 10,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, color: muted }}>Income</Text>
            <Switch
              value={addForm.isIncome}
              onValueChange={(value) => setAddForm((f) => ({ ...f, isIncome: value }))}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, color: muted }}>Ignore</Text>
            <Switch
              value={addForm.ignored}
              onValueChange={(value) => setAddForm((f) => ({ ...f, ignored: value }))}
            />
          </View>
          <Pressable
            onPress={handleAddExpense}
            style={{ backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Save</Text>
          </Pressable>
        </View>
      )}

      {/* Search bar */}
      <View
        style={{
          backgroundColor: inputBg,
          borderRadius: 10,
          marginBottom: 14,
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
            paddingHorizontal: 14,
            paddingVertical: 10,
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
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: border,
            alignItems: 'center',
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <View style={{ marginBottom: 12, opacity: 0.5 }}>
            <Receipt size={48} color={muted} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: label, marginBottom: 6, textAlign: 'center' }}>
            No transactions yet
          </Text>
          <Text style={{ fontSize: 15, color: muted, marginBottom: 14, textAlign: 'center' }}>
            Import a CSV or add your first transaction to get started.
          </Text>
          <Pressable
            onPress={() => setShowAddForm(true)}
            style={{ backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Add transaction</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ paddingBottom: 20 }}>
          {filtered.map((row, i) => {
            const isCredit = (parseFloat(row.credit) || 0) > 0
            const amountColor = isCredit ? '#16a34a' : '#dc2626'
            const categoryName =
              row.budgetCategoryId && categories.find((c) => c.id === row.budgetCategoryId)?.name
            return (
              <View key={`${row.transactionDate}-${row.description}-${row.debit}-${row.credit}`}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: border }} /> : null}
                <Pressable
                  onPress={() => openEditSheet(row)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    backgroundColor: bg,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: label }} numberOfLines={1}>
                      {row.description}
                    </Text>
                    <Text style={{ fontSize: 13, color: muted, marginTop: 2 }} numberOfLines={1}>
                      {row.transactionDate} · {categoryName || row.category || 'Uncategorized'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: amountColor,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {isCredit ? '+' : '-'}${isCredit ? row.credit : row.debit}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>

      {/* Edit expense sheet */}
      <Modal
        visible={editingIndex !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingIndex(null)}
      >
        <View style={{ flex: 1, backgroundColor: bg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: border,
            }}
          >
            <Pressable onPress={() => setEditingIndex(null)} hitSlop={12}>
              <Text style={{ fontSize: 17, color: '#0ea5e9' }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600', color: label }}>Edit transaction</Text>
            <Pressable onPress={handleSaveEdit} hitSlop={12}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#10b981' }}>Save</Text>
            </Pressable>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              value={editForm.transactionDate}
              onChangeText={(v) => setEditForm((f) => ({ ...f, transactionDate: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={muted}
              style={{
                backgroundColor: inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: label,
                marginBottom: 8,
              }}
            />
            <TextInput
              value={editForm.description}
              onChangeText={(v) => setEditForm((f) => ({ ...f, description: v }))}
              placeholder="Description"
              placeholderTextColor={muted}
              style={{
                backgroundColor: inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: label,
                marginBottom: 8,
              }}
            />
            <TextInput
              value={editForm.amount}
              onChangeText={(v) => setEditForm((f) => ({ ...f, amount: v }))}
              keyboardType="decimal-pad"
              placeholder="Amount"
              placeholderTextColor={muted}
              style={{
                backgroundColor: inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: label,
                marginBottom: 8,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, color: muted }}>Income</Text>
              <Switch
                value={editForm.isIncome}
                onValueChange={(v) => setEditForm((f) => ({ ...f, isIncome: v }))}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, color: muted }}>Ignore</Text>
              <Switch
                value={editForm.ignored}
                onValueChange={(v) => setEditForm((f) => ({ ...f, ignored: v }))}
              />
            </View>
            <Text style={{ fontSize: 15, color: muted, marginBottom: 8 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setEditForm((f) => ({ ...f, budgetCategoryId: cat.id }))}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: editForm.budgetCategoryId === cat.id ? '#0ea5e9' : segmentBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: editForm.budgetCategoryId === cat.id ? '#fff' : label,
                    }}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() =>
                Alert.alert('Delete transaction', 'Delete this transaction?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: handleDeleteFromEdit },
                ])
              }
              style={{
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.5)',
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444' }}>Delete transaction</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}
