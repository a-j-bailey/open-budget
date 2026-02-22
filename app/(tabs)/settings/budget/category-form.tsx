import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { NativeButton, NativeTextField } from '../../../../components/swift-ui'
import { useThemeContext } from '../../../../contexts/ThemeContext'
import { useBudget } from '../../../../hooks/useBudget'
import { hapticImpact, hapticSelection } from '../../../../lib/haptics'

const INSET_H = 20
const SECTION_GAP = 20
const ROW_MIN_HEIGHT = 44
const GROUP_RADIUS = 12

export default function CategoryFormScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isDark } = useThemeContext()
  const { categories, addCategory, updateCategory, removeCategory } = useBudget()

  const existing = id ? categories.find((c) => c.id === id) : null
  const isEdit = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? '')
  const [monthlyLimit, setMonthlyLimit] = useState(
    existing != null ? String(existing.monthlyLimit) : ''
  )
  const [type, setType] = useState<'expense' | 'income'>(
    existing?.type === 'income' ? 'income' : 'expense'
  )

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setMonthlyLimit(String(existing.monthlyLimit))
      setType(existing.type === 'income' ? 'income' : 'expense')
    }
  }, [existing?.id])

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const segmentBg = isDark ? '#292524' : '#e7e5e4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'

  const handleSave = () => {
    const trimmedName = name.trim()
    const limit = parseFloat(monthlyLimit)
    if (!trimmedName || Number.isNaN(limit) || limit < 0) return
    hapticImpact()
    if (isEdit && id) {
      updateCategory(id, { name: trimmedName, monthlyLimit: limit, type })
    } else {
      addCategory(trimmedName, limit, type)
    }
    router.back()
  }

  const handleRemove = () => {
    if (!id) return
    hapticImpact()
    removeCategory(id)
    router.back()
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
          {isEdit ? 'Edit category' : 'Add category'}
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
          <Text style={{ fontSize: 17, color: label, width: 100 }}>Name</Text>
          <NativeTextField
            value={name}
            onChangeText={setName}
            placeholder="Category name"
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
          <Text style={{ fontSize: 17, color: label, width: 100 }}>
            {type === 'income' ? 'Expected' : 'Limit'}
          </Text>
          <NativeTextField
            value={monthlyLimit}
            onChangeText={setMonthlyLimit}
            keyboardType="decimal-pad"
            placeholder={type === 'income' ? 'Expected amount' : 'Monthly limit'}
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
            minHeight: ROW_MIN_HEIGHT,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 17, color: label, width: 100 }}>Type</Text>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            {(
              [
                { key: 'expense' as const, label: 'Expense' },
                { key: 'income' as const, label: 'Income' },
              ] as const
            ).map(({ key, label: l }) => (
              <Pressable
                key={key}
                onPress={() => {
                  hapticSelection()
                  setType(key)
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: type === key ? segmentActive : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: type === key ? label : muted,
                  }}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {isEdit && id ? (
        <View style={{ marginTop: 8 }}>
          <NativeButton
            label="Remove category"
            role="destructive"
            onPress={handleRemove}
            fallbackBackgroundColor="#ef4444"
            fallbackTextColor="#ffffff"
          />
        </View>
      ) : null}
    </ScrollView>
  )
}
