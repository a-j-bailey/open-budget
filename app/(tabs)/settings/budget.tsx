import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { NativeButton, NativeSegmentedPicker, NativeTextField } from '../../../components/swift-ui'
import { useThemeContext } from '../../../contexts/ThemeContext'
import { useBudget } from '../../../hooks/useBudget'
import { Card } from '../../../components/Card'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

export default function BudgetScreen() {
  const { isDark } = useThemeContext()
  const { categories, addCategory, updateCategory, removeCategory } = useBudget()

  const [newName, setNewName] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [viewMode, setViewMode] = useState<'debit' | 'credit'>('debit')

  const visibleCategories = useMemo(
    () => categories.filter((c) => (viewMode === 'credit' ? c.type === 'income' : (c.type ?? 'expense') === 'expense')),
    [categories, viewMode]
  )

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const segmentBg = isDark ? '#292524' : '#f5f5f4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'
  const inputBg = isDark ? '#292524' : '#fafaf9'

  const viewModeOptions = [
    { label: 'Expense', value: 'debit' as const },
    { label: 'Income', value: 'credit' as const },
  ]

  const handleAddCategory = () => {
    const name = newName.trim()
    const limit = parseFloat(newLimit)
    if (!name || Number.isNaN(limit) || limit < 0) return
    addCategory(name, limit, viewMode === 'credit' ? 'income' : 'expense')
    setNewName('')
    setNewLimit('')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#0c0a09' : '#fafaf9' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 20,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Card title="New category" isDark={isDark} preferPlain>
        <NativeSegmentedPicker
          value={viewMode}
          options={viewModeOptions}
          onChange={setViewMode}
          containerStyle={{ marginBottom: 10 }}
          fallbackBackgroundColor={segmentBg}
          fallbackSelectedBackgroundColor={segmentActive}
          fallbackTextColor={muted}
          fallbackSelectedTextColor={label}
        />
        <NativeTextField
          value={newName}
          onChangeText={setNewName}
          placeholder="Category name"
          placeholderTextColor={muted}
          containerStyle={{ marginBottom: 8 }}
          inputStyle={{
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
        <NativeTextField
          value={newLimit}
          onChangeText={setNewLimit}
          keyboardType="decimal-pad"
          placeholder={viewMode === 'credit' ? 'Expected amount' : 'Monthly limit'}
          placeholderTextColor={muted}
          containerStyle={{ marginBottom: 10 }}
          inputStyle={{
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
        <NativeButton
          label="Add category"
          onPress={handleAddCategory}
          fallbackBackgroundColor="#0ea5e9"
          fallbackTextColor="#ffffff"
        />
      </Card>

      {visibleCategories.map((cat) => (
        <View
          key={cat.id}
          style={{
            backgroundColor: bg,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: border,
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <NativeTextField
            value={cat.name}
            onChangeText={(value) => updateCategory(cat.id, { name: value })}
            containerStyle={{ marginBottom: 8 }}
            inputStyle={{
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
          <NativeTextField
            value={String(cat.monthlyLimit)}
            onChangeText={(value) => {
              const next = parseFloat(value)
              if (!Number.isNaN(next) && next >= 0) updateCategory(cat.id, { monthlyLimit: next })
            }}
            keyboardType="decimal-pad"
            containerStyle={{ marginBottom: 10 }}
            inputStyle={{
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: muted }}>
              {cat.type === 'income' ? 'Income category' : 'Expense category'}
            </Text>
            <NativeButton
              label="Remove"
              role="destructive"
              onPress={() => removeCategory(cat.id)}
              fallbackBackgroundColor="#ef4444"
              fallbackTextColor="#ffffff"
            />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
