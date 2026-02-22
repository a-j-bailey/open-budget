import { useLayoutEffect } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from 'expo-router'
import { router } from 'expo-router'
import { Pencil, Plus } from 'lucide-react-native'
import { useThemeContext } from '../../../../contexts/ThemeContext'
import { useRules } from '../../../../hooks/useRules'
import { useBudget } from '../../../../hooks/useBudget'
import { hapticSelection } from '../../../../lib/haptics'
import type { Rule } from '../../../../types'

export default function RulesScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { isDark } = useThemeContext()
  const { rules } = useRules()
  const { categories } = useBudget()

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            hapticSelection()
            router.push('/settings/rules/rule-form')
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

  const renderItem = ({ item }: { item: Rule }) => {
    const targetLabel =
      item.targetCategoryId === 'ignore'
        ? 'Ignore'
        : categories.find((c) => c.id === item.targetCategoryId)?.name ?? item.targetCategoryId
    return (
      <Pressable
        onPress={() => {
          hapticSelection()
          router.push({ pathname: '/settings/rules/rule-form', params: { id: item.id } })
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 8,}}>
          <View style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: label }} numberOfLines={1}>
              {item.pattern}
            </Text>
            <Text style={{ fontSize: 13, color: muted, marginTop: 4 }}>
              match {item.source} → {targetLabel}
            </Text>
          </View>
          <View style={{ marginLeft: 16, justifyContent: 'center' }}>
            <Pencil size={20} color={iconTint} />
          </View>
        </View>
      </Pressable>
    )
  }

  return (
    <FlatList
      data={rules}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
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
          <Text style={{ fontSize: 15, color: muted }}>No rules yet. Tap + to add one.</Text>
        </View>
      }
    />
  )
}
