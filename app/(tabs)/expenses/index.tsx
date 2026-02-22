import { useCallback, useMemo, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { Receipt } from 'lucide-react-native'
import { MonthSelector } from '../../../components/MonthSelector'
import type { ExpenseRow } from '../../../types'
import { useMonth } from '../../../contexts/MonthContext'
import { useExpenses } from '../../../hooks/useExpenses'
import { useBudget } from '../../../hooks/useBudget'
import { useRules, applyRules } from '../../../hooks/useRules'
import { useThemeContext } from '../../../contexts/ThemeContext'
import { syncFromCloudIfAvailable } from '../../../lib/cloudSync'
import { hapticImpact, hapticSelection } from '../../../lib/haptics'
import { Tabs, router } from 'expo-router'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

const openAddTransaction = () => {
  hapticImpact()
  router.push('/expenses/transaction')
}

function openEditTransaction(row: ExpenseRow, expenses: ExpenseRow[]) {
  const idx = expenses.findIndex(
    (e) =>
      e.transactionDate === row.transactionDate &&
      e.description === row.description &&
      e.debit === row.debit &&
      e.credit === row.credit
  )
  if (idx < 0) return
  hapticSelection()
  router.push({ pathname: '/expenses/transaction', params: { index: String(idx) } })
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets()
  const { selectedMonth } = useMonth()
  const { isDark } = useThemeContext()
  const {
    expenses,
    loading,
    error,
    reload: reloadExpenses,
    importAndMerge,
    deleteRow,
    setAllExpenses,
  } = useExpenses(selectedMonth)
  const { categories, reload: reloadBudget } = useBudget()
  const { rules, reload: reloadRules } = useRules()

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncFromCloudIfAvailable()
      await Promise.all([reloadExpenses(), reloadBudget(), reloadRules()])
    } finally {
      setRefreshing(false)
    }
  }, [reloadExpenses, reloadBudget, reloadRules])

  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
          paddingTop: insets.top + 14,
          paddingHorizontal: 14,
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '700', color: label, letterSpacing: -0.6 }}>Transactions</Text>
        <Text style={{ marginTop: 10, fontSize: 16, color: muted }}>Loading…</Text>
      </View>
    )
  }

  return (
    <>
      <Tabs.Screen options={{ headerRight: () => <MonthSelector /> }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? '#0c0a09' : '#fafaf9' }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: 12,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Action bar: primary and secondary buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <Pressable
            onPress={() => {
              hapticImpact()
              runImport()
            }}
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
            onPress={openAddTransaction}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: '#10b981',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Add</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticImpact()
              reapplyRules()
            }}
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
              onPress={openAddTransaction}
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
                    onPress={() => openEditTransaction(row, expenses)}
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
    </>
  )
}
