import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { DatePicker, Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { datePickerStyle, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { Check, Receipt } from 'lucide-react-native'
import { NativeButton, NativeTextField, NativeToggle } from '../../components/swift-ui'
import { MonthSelector } from '../../components/MonthSelector'
import type { ExpenseRow } from '../../types'
import { useMonth } from '../../contexts/MonthContext'
import { useExpenses } from '../../hooks/useExpenses'
import { useBudget } from '../../hooks/useBudget'
import { useRules, applyRules } from '../../hooks/useRules'
import { useThemeContext } from '../../contexts/ThemeContext'
import { Tabs } from 'expo-router'

const GROUP_RADIUS = 12
const ROW_MIN_HEIGHT = 44
const INSET_H = 20
const SECTION_GAP = 20

const today = () => new Date().toISOString().slice(0, 10)
const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }
const isIOS = process.env.EXPO_OS === 'ios'

const parseISODate = (value: string) => {
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return new Date()
  return new Date(year, month - 1, day)
}

const formatISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets()
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

  const editCategoryOptions = useMemo(
    () =>
      categories.filter((cat) =>
        editForm.isIncome ? cat.type === 'income' : (cat.type ?? 'expense') === 'expense'
      ),
    [categories, editForm.isIncome]
  )

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const inputBg = isDark ? '#292524' : '#f5f5f4'
  const segmentBg = isDark ? '#292524' : '#e7e5e4'

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 14, paddingHorizontal: 14, justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: label, letterSpacing: -0.6 }}>Transactions</Text>
        <Text style={{ marginTop: 10, fontSize: 16, color: muted }}>Loading…</Text>
      </View>
    )
  }

  return (
    <>
      <Tabs.Screen options={{ headerRight: () => <MonthSelector /> }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
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

      {/* Edit transaction sheet — iOS inset grouped style */}
      <Modal
        visible={editingIndex !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingIndex(null)}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#0c0a09' : '#f2f2f7' }}>
          {/* Sheet grabber + nav — compact top, respect safe area */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
            }}
          >
            <NativeButton
              label="Cancel"
              role="cancel"
              iosButtonStyle="plain"
              onPress={() => setEditingIndex(null)}
              fallbackTextColor="#0a84ff"
              fallbackAlign="flex-start"
              containerStyle={{ minWidth: 70, alignItems: 'flex-start' }}
            />
            <Text style={{ fontSize: 17, fontWeight: '600', color: label }}>Edit transaction</Text>
            <NativeButton
              label="Save"
              onPress={handleSaveEdit}
              fallbackTextColor="#34c759"
              fallbackAlign="flex-end"
              containerStyle={{ minWidth: 70, alignItems: 'flex-end' }}
            />
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingHorizontal: INSET_H,
              paddingBottom: Math.max(insets.bottom, 24) + 24,
              gap: SECTION_GAP,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Transaction details group */}
            <View
              style={{
                backgroundColor: bg,
                borderRadius: GROUP_RADIUS,
                overflow: 'hidden',
                borderCurve: 'continuous',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ fontSize: 17, color: label, width: 100 }}>Date</Text>
                {isIOS ? (
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Host matchContents>
                      <DatePicker
                        title="Date"
                        selection={parseISODate(editForm.transactionDate)}
                        displayedComponents={['date']}
                        modifiers={[datePickerStyle('compact')]}
                        onDateChange={(nextDate) =>
                          setEditForm((f) => ({ ...f, transactionDate: formatISODate(nextDate) }))
                        }
                      />
                    </Host>
                  </View>
                ) : (
                  <NativeTextField
                    value={editForm.transactionDate}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, transactionDate: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={muted}
                    align="right"
                    containerStyle={{ flex: 1 }}
                    inputStyle={{
                      flex: 1,
                      fontSize: 17,
                      color: label,
                      paddingVertical: 10,
                      paddingLeft: 8,
                    }}
                  />
                )}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ fontSize: 17, color: label, width: 100 }}>Description</Text>
                <NativeTextField
                  value={editForm.description}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, description: v }))}
                  placeholder="Payee or memo"
                  placeholderTextColor={muted}
                  align="right"
                  containerStyle={{ flex: 1 }}
                  inputStyle={{
                    flex: 1,
                    fontSize: 17,
                    color: label,
                    paddingVertical: 10,
                    paddingLeft: 8,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ fontSize: 17, color: label, width: 100 }}>Amount</Text>
                <NativeTextField
                  value={editForm.amount}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, amount: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={muted}
                  align="right"
                  containerStyle={{ flex: 1 }}
                  inputStyle={{
                    flex: 1,
                    fontSize: 17,
                    color: label,
                    paddingVertical: 10,
                    paddingLeft: 8,
                    fontVariant: ['tabular-nums'],
                    textAlign: 'right',
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                  borderBottomWidth: isIOS ? 1 : 0,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ fontSize: 17, color: label }}>Income</Text>
                <NativeToggle
                  value={editForm.isIncome}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, isIncome: v }))}
                  trackColor={{ false: segmentBg, true: 'rgba(52, 199, 89, 0.35)' }}
                  thumbColor={editForm.isIncome ? '#34c759' : undefined}
                />
              </View>
              {isIOS ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: ROW_MIN_HEIGHT,
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ fontSize: 17, color: label, width: 100 }}>Category</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Host style={{ flex: 1, width: '100%' }}>
                      <Picker<string>
                        selection={editForm.budgetCategoryId ?? ''}
                        onSelectionChange={(selection) => setEditForm((f) => ({ ...f, budgetCategoryId: selection }))}
                        modifiers={[pickerStyle('menu')]}
                      >
                        <SwiftText modifiers={[tag('')]}>Uncategorized</SwiftText>
                        {editCategoryOptions.map((cat) => (
                          <SwiftText key={cat.id} modifiers={[tag(cat.id)]}>
                            {cat.name}
                          </SwiftText>
                        ))}
                      </Picker>
                    </Host>
                  </View>
                </View>
              ) : null}
            </View>

            {!isIOS ? (
              <View
                style={{
                  backgroundColor: bg,
                  borderRadius: GROUP_RADIUS,
                  overflow: 'hidden',
                  borderCurve: 'continuous',
                }}
              >
                {editCategoryOptions.map((cat, i) => {
                  const selected = editForm.budgetCategoryId === cat.id
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setEditForm((f) => ({ ...f, budgetCategoryId: cat.id }))}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: ROW_MIN_HEIGHT,
                        paddingHorizontal: 16,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: border,
                        backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                      })}
                    >
                      <Text style={{ fontSize: 17, color: label }}>{cat.name}</Text>
                      {selected ? (
                        <Check size={22} color="#0a84ff" strokeWidth={2.5} />
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>
            ) : null}

            {/* Ignore group */}
            <View
              style={{
                backgroundColor: bg,
                borderRadius: GROUP_RADIUS,
                overflow: 'hidden',
                borderCurve: 'continuous',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontSize: 17, color: label }}>Ignore</Text>
                <NativeToggle
                  value={editForm.ignored}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, ignored: v }))}
                  trackColor={{ false: segmentBg, true: 'rgba(255, 149, 0, 0.35)' }}
                  thumbColor={editForm.ignored ? '#ff9500' : undefined}
                />
              </View>
            </View>

            {/* Delete group — aligned with other rows */}
            <NativeButton
              label="Delete transaction"
              role="destructive"
              iosButtonStyle="borderedProminent"
              onPress={() =>
                Alert.alert('Delete transaction', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: handleDeleteFromEdit },
                ])
              }
              fallbackBackgroundColor="#ef4444"
              fallbackTextColor="#ffffff"
              fallbackAlign="center"
              containerStyle={{
                minHeight: ROW_MIN_HEIGHT,
                justifyContent: 'center',
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}
