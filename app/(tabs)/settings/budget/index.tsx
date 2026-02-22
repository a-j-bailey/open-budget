import { useLayoutEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, router } from 'expo-router'
import { Pencil, Plus } from 'lucide-react-native'
import { NativeSegmentedPicker } from '../../../../components/swift-ui'
import { useThemeContext } from '../../../../contexts/ThemeContext'
import { useBudget } from '../../../../hooks/useBudget'
import { hapticSelection } from '../../../../lib/haptics'
import type { BudgetCategory } from '../../../../types'

export default function BudgetScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { isDark } = useThemeContext()
  const { categories } = useBudget()
  const [viewMode, setViewMode] = useState<'debit' | 'credit'>('debit')

  const visibleCategories = useMemo(
    () =>
      categories.filter((c) =>
        viewMode === 'credit' ? c.type === 'income' : (c.type ?? 'expense') === 'expense'
      ),
    [categories, viewMode]
  )

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            hapticSelection()
            router.push('/settings/budget/category-form')
          }}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <Plus size={24} color={isDark ? '#fafaf9' : '#1c1917'} strokeWidth={2} />
        </Pressable>
      ),
    })
    return () => {
      parent?.setOptions({ headerRight: undefined })
    }
  }, [navigation, isDark])

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const iconTint = isDark ? '#d6d3d1' : '#a8a29e'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const screenBg = isDark ? '#0c0a09' : '#fafaf9'
  const segmentBg = isDark ? '#292524' : '#f5f5f4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'

  const viewModeOptions = [
    { label: 'Expense', value: 'debit' as const },
    { label: 'Income', value: 'credit' as const },
  ]

  const listHeader = (
    <View style={{ marginBottom: 16 }}>
      <NativeSegmentedPicker
        value={viewMode}
        options={viewModeOptions}
        onChange={setViewMode}
        containerStyle={{ marginBottom: 0 }}
        fallbackBackgroundColor={segmentBg}
        fallbackSelectedBackgroundColor={segmentActive}
        fallbackTextColor={muted}
        fallbackSelectedTextColor={label}
      />
    </View>
  )

  const renderItem = ({ item: cat }: { item: BudgetCategory }) => (
    <Pressable
      onPress={() => {
        hapticSelection()
        router.push({ pathname: '/settings/budget/category-form', params: { id: cat.id } })
      }}
      style={({ pressed }) => ({

        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 8 }}>
        <View style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: label }} numberOfLines={1}>
            {cat.name}
          </Text>
          <Text style={{ fontSize: 13, color: muted, marginTop: 4 }}>
            ${cat.monthlyLimit.toFixed(2)}
          </Text>
        </View>
        <View style={{ marginLeft: 16, justifyContent: 'center' }}>
          <Pencil size={20} color={iconTint} />
        </View>
      </View>
    </Pressable>
  )

  return (
    <FlatList
      data={visibleCategories}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: border }} />
      )}
      style={{ flex: 1, backgroundColor: screenBg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
      ListEmptyComponent={
        <View style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: muted }}>
            No {viewMode === 'credit' ? 'income' : 'expense'} categories yet. Tap + to add one.
          </Text>
        </View>
      }
    />
  )
}
