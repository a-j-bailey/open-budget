import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { NativeButton, NativeTextField } from '../../../../components/swift-ui'
import { useThemeContext } from '../../../../contexts/ThemeContext'
import { useRules } from '../../../../hooks/useRules'
import { useBudget } from '../../../../hooks/useBudget'
import { hapticImpact, hapticSelection } from '../../../../lib/haptics'

const INSET_H = 20
const SECTION_GAP = 20
const ROW_MIN_HEIGHT = 44
const GROUP_RADIUS = 12

export default function RuleFormScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { isDark } = useThemeContext()
  const { rules, addRule, updateRule, removeRule } = useRules()
  const { categories } = useBudget()

  const existing = id ? rules.find((r) => r.id === id) : null
  const isEdit = Boolean(existing)

  const [pattern, setPattern] = useState(existing?.pattern ?? '')
  const [source, setSource] = useState<'description' | 'category'>(existing?.source ?? 'description')
  const [targetCategoryId, setTargetCategoryId] = useState<string>(existing?.targetCategoryId ?? 'ignore')

  useEffect(() => {
    if (existing) {
      setPattern(existing.pattern)
      setSource(existing.source)
      setTargetCategoryId(existing.targetCategoryId)
    }
  }, [existing?.id])

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const segmentBg = isDark ? '#292524' : '#e7e5e4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'

  const handleSave = () => {
    const p = pattern.trim()
    if (!p) return
    hapticImpact()
    if (isEdit && id) {
      updateRule(id, { pattern: p, source, targetCategoryId })
    } else {
      addRule({ pattern: p, source, targetCategoryId })
    }
    router.back()
  }

  const handleRemove = () => {
    if (!id) return
    hapticImpact()
    removeRule(id)
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
          {isEdit ? 'Edit rule' : 'Add rule'}
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
          <Text style={{ fontSize: 17, color: label, width: 100 }}>Pattern</Text>
          <NativeTextField
            value={pattern}
            onChangeText={setPattern}
            placeholder="e.g. Audible or /^AMZN/"
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
          <Text style={{ fontSize: 17, color: label, width: 100 }}>Match</Text>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            {(
              [
                { key: 'description' as const, label: 'Description' },
                { key: 'category' as const, label: 'Category' },
              ] as const
            ).map(({ key, label: l }) => (
              <Pressable
                key={key}
                onPress={() => {
                  hapticSelection()
                  setSource(key)
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: source === key ? segmentActive : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: source === key ? label : muted,
                  }}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <Text style={{ fontSize: 13, color: muted, marginBottom: 8 }}>Then assign</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              onPress={() => {
                hapticSelection()
                setTargetCategoryId('ignore')
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: targetCategoryId === 'ignore' ? '#ff9500' : segmentBg,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: targetCategoryId === 'ignore' ? '#fff' : label,
                }}
              >
                Ignore
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  hapticSelection()
                  setTargetCategoryId(cat.id)
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: targetCategoryId === cat.id ? '#0ea5e9' : segmentBg,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: targetCategoryId === cat.id ? '#fff' : label,
                  }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {isEdit && id ? (
        <View style={{ marginTop: 8 }}>
          <NativeButton
            label="Remove rule"
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
