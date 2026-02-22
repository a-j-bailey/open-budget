import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { Check } from 'lucide-react-native'
import {
  NativeButton,
  NativeSegmentedPicker,
  NativeTextField,
  NativeToggle,
} from '../../../../components/swift-ui'
import { useThemeContext } from '../../../../contexts/ThemeContext'
import { useRules } from '../../../../hooks/useRules'
import { useBudget } from '../../../../hooks/useBudget'
import { hapticImpact, hapticSelection } from '../../../../lib/haptics'

const isIOS = process.env.EXPO_OS === 'ios'
const INSET_H = 20
const SECTION_GAP = 20
const ROW_MIN_HEIGHT = 44
const GROUP_RADIUS = 12
const SECTION_LABEL_MB = 8

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

  const ignored = targetCategoryId === 'ignore'
  const effectiveCategoryId = ignored ? categories[0]?.id ?? 'ignore' : targetCategoryId

  useEffect(() => {
    if (existing) {
      setPattern(existing.pattern)
      setSource(existing.source)
      setTargetCategoryId(existing.targetCategoryId)
    }
  }, [existing?.id])

  const categoryOptions = useMemo(
    () => categories.filter((cat) => (cat.type ?? 'expense') === 'expense'),
    [categories]
  )

  const setIgnored = (value: boolean) => {
    if (value) {
      setTargetCategoryId('ignore')
    } else {
      setTargetCategoryId(
        effectiveCategoryId === 'ignore' ? categoryOptions[0]?.id ?? 'ignore' : effectiveCategoryId
      )
    }
  }

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

  const sourceOptions = [
    { label: 'Description', value: 'description' as const },
    { label: 'Category', value: 'category' as const },
  ]

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

      {/* If expense matches: */}
      <View>
        <Text style={{ fontSize: 13, color: muted, marginBottom: SECTION_LABEL_MB }}>
          If expense matches:
        </Text>
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
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: border,
            }}
          >
            <NativeSegmentedPicker
              value={source}
              options={sourceOptions}
              onChange={(v) => setSource(v)}
              containerStyle={{ marginBottom: 0 }}
              fallbackBackgroundColor={segmentBg}
              fallbackSelectedBackgroundColor={segmentActive}
              fallbackTextColor={muted}
              fallbackSelectedTextColor={label}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: ROW_MIN_HEIGHT,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 17, color: label, width: 80 }}>Pattern</Text>
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
        </View>
      </View>

      {/* Then Set: */}
      <View>
        <Text style={{ fontSize: 13, color: muted, marginBottom: SECTION_LABEL_MB }}>
          Then Set:
        </Text>
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
            <Text style={{ fontSize: 17, color: label, width: 100 }}>Category</Text>
            {ignored ? (
              <Text style={{ fontSize: 15, color: muted }}>—</Text>
            ) : categoryOptions.length === 0 ? (
              <Text style={{ fontSize: 14, color: muted }}>No categories</Text>
            ) : isIOS ? (
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Host style={{ flex: 1, width: '100%' }}>
                  <Picker<string>
                    selection={targetCategoryId}
                    onSelectionChange={(selection) => {
                      hapticSelection()
                      setTargetCategoryId(selection)
                    }}
                    modifiers={[pickerStyle('menu')]}
                  >
                    {categoryOptions.map((cat) => (
                      <SwiftText key={cat.id} modifiers={[tag(cat.id)]}>
                        {cat.name}
                      </SwiftText>
                    ))}
                  </Picker>
                </Host>
              </View>
            ) : (
              <Text style={{ fontSize: 17, color: label }}>
                {categoryOptions.find((c) => c.id === targetCategoryId)?.name ?? '—'}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: ROW_MIN_HEIGHT,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 17, color: label }}>Ignored</Text>
            <NativeToggle
              value={ignored}
              onValueChange={(v) => {
                hapticSelection()
                setIgnored(v)
              }}
              trackColor={{ false: isDark ? '#44403c' : '#d6d3d1', true: isDark ? '#ff9500' : '#ff9f0a' }}
              thumbColor={isDark ? '#fafaf9' : '#ffffff'}
            />
          </View>
        </View>
      </View>

      {!isIOS && !ignored && categoryOptions.length > 0 ? (
        <View
          style={{
            backgroundColor: bg,
            borderRadius: GROUP_RADIUS,
            overflow: 'hidden',
            borderCurve: 'continuous',
          }}
        >
          {categoryOptions.map((cat, i) => {
            const selected = targetCategoryId === cat.id
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  hapticSelection()
                  setTargetCategoryId(cat.id)
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
