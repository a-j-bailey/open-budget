import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { DatePicker, Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { datePickerStyle, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { Check } from 'lucide-react-native'
import { NativeButton, NativeTextField, NativeToggle } from '../../../components/swift-ui'
import { useMonth } from '../../../contexts/MonthContext'
import { useExpenses } from '../../../hooks/useExpenses'
import { useBudget } from '../../../hooks/useBudget'
import { useRules } from '../../../hooks/useRules'
import { useThemeContext } from '../../../contexts/ThemeContext'
import { hapticImpact, hapticSelection } from '../../../lib/haptics'
import { router } from 'expo-router'

const GROUP_RADIUS = 12
const ROW_MIN_HEIGHT = 44
const INSET_H = 20
const SECTION_GAP = 20

const today = () => new Date().toISOString().slice(0, 10)
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

const defaultForm = () => ({
  transactionDate: today(),
  description: '',
  amount: '',
  isIncome: false,
  budgetCategoryId: '' as string | null,
  ignored: false,
})

export default function TransactionScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ index?: string }>()
  const { selectedMonth } = useMonth()
  const { isDark } = useThemeContext()
  const { expenses, addExpense, setAllExpenses, deleteRow } = useExpenses(selectedMonth)
  const { categories } = useBudget()
  const { rules } = useRules()

  const editIndex = params.index != null && params.index !== '' ? Number(params.index) : null
  const isEdit = editIndex !== null && Number.isFinite(editIndex) && editIndex >= 0 && editIndex < expenses.length

  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    if (isEdit && expenses[editIndex!]) {
      const row = expenses[editIndex!]
      const isCredit = (parseFloat(row.credit) || 0) > 0
      const amount = isCredit ? row.credit : row.debit
      setForm({
        transactionDate: row.transactionDate,
        description: row.description,
        amount,
        isIncome: isCredit,
        budgetCategoryId: row.budgetCategoryId ?? '',
        ignored: row.ignored,
      })
    } else if (!isEdit) {
      setForm(defaultForm())
    }
  }, [isEdit, editIndex, expenses])

  const categoryOptions = useMemo(
    () =>
      categories.filter((cat) =>
        form.isIncome ? cat.type === 'income' : (cat.type ?? 'expense') === 'expense'
      ),
    [categories, form.isIncome]
  )

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const segmentBg = isDark ? '#292524' : '#e7e5e4'

  const handleSave = () => {
    if (!form.description.trim() || !form.amount.trim()) return
    hapticImpact()
    if (isEdit && editIndex != null) {
      const next = expenses.map((row, i) => {
        if (i !== editIndex) return row
        return {
          ...row,
          transactionDate: form.transactionDate.trim(),
          description: form.description.trim(),
          debit: form.isIncome ? '0' : form.amount.trim().replace(/[,$]/g, ''),
          credit: form.isIncome ? form.amount.trim().replace(/[,$]/g, '') : '0',
          budgetCategoryId: form.budgetCategoryId === '' ? null : form.budgetCategoryId,
          ignored: form.ignored,
        }
      })
      setAllExpenses(next)
    } else {
      addExpense(
        {
          transactionDate: form.transactionDate,
          description: form.description.trim(),
          debit: form.isIncome ? '0' : form.amount.trim(),
          credit: form.isIncome ? form.amount.trim() : '0',
          budgetCategoryId: form.budgetCategoryId === '' ? null : form.budgetCategoryId,
          ignored: form.ignored,
        },
        rules
      )
    }
    router.back()
  }

  const handleDelete = () => {
    if (!isEdit || editIndex == null) return
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteRow(editIndex)
        router.back()
      } },
    ])
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#0c0a09' : '#f2f2f7' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: 32,
        paddingHorizontal: INSET_H,
        paddingBottom: Math.max(insets.bottom, 24) + 24,
        gap: SECTION_GAP,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <NativeButton
          label="Cancel"
          role="cancel"
          iosButtonStyle="plain"
          onPress={() => router.back()}
          fallbackTextColor="#0a84ff"
          fallbackAlign="flex-start"
          containerStyle={{ minWidth: 70, alignItems: 'flex-start' }}
        />
        <Text style={{ fontSize: 17, fontWeight: '600', color: label }}>
          {isEdit ? 'Edit transaction' : 'Add transaction'}
        </Text>
        <NativeButton
          label="Save"
          onPress={handleSave}
          fallbackTextColor="#34c759"
          fallbackAlign="flex-end"
          containerStyle={{ minWidth: 70, alignItems: 'flex-end' }}
        />
      </View>
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
            <View style={{ flex: 1, alignItems: 'flex-end', backgroundColor: bg }}>
              <Host matchContents>
                <DatePicker
                  selection={parseISODate(form.transactionDate)}
                  displayedComponents={['date']}
                  modifiers={[datePickerStyle('compact')]}
                  onDateChange={(nextDate) =>
                    setForm((f) => ({ ...f, transactionDate: formatISODate(nextDate) }))
                  }
                />
              </Host>
            </View>
          ) : (
            <NativeTextField
              value={form.transactionDate}
              onChangeText={(v) => setForm((f) => ({ ...f, transactionDate: v }))}
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
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
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
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
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
            value={form.isIncome}
            onValueChange={(v) => setForm((f) => ({ ...f, isIncome: v }))}
            trackColor={{ false: segmentBg, true: 'rgba(52, 199, 89, 0.35)' }}
            thumbColor={form.isIncome ? '#34c759' : undefined}
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
                  selection={form.budgetCategoryId ?? ''}
                  onSelectionChange={(selection) =>
                    setForm((f) => ({ ...f, budgetCategoryId: selection }))
                  }
                  modifiers={[pickerStyle('menu')]}
                >
                  <SwiftText modifiers={[tag('')]}>Uncategorized</SwiftText>
                  {categoryOptions.map((cat) => (
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
          {categoryOptions.map((cat, i) => {
            const selected = form.budgetCategoryId === cat.id
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  hapticSelection()
                  setForm((f) => ({ ...f, budgetCategoryId: cat.id }))
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: ROW_MIN_HEIGHT,
                  paddingHorizontal: 16,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: border,
                  backgroundColor: pressed
                    ? isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)'
                    : 'transparent',
                })}
              >
                <Text style={{ fontSize: 17, color: label }}>{cat.name}</Text>
                {selected ? <Check size={22} color="#0a84ff" strokeWidth={2.5} /> : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}

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
            value={form.ignored}
            onValueChange={(v) => setForm((f) => ({ ...f, ignored: v }))}
            trackColor={{ false: segmentBg, true: 'rgba(255, 149, 0, 0.35)' }}
            thumbColor={form.ignored ? '#ff9500' : undefined}
          />
        </View>
      </View>

      {isEdit ? (
        <NativeButton
          label="Delete transaction"
          role="destructive"
          iosButtonStyle="borderedProminent"
          onPress={handleDelete}
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
      ) : null}
    </ScrollView>
  )
}
