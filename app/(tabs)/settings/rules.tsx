import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { NativeButton, NativeSegmentedPicker, NativeTextField } from '../../../components/swift-ui'
import { useThemeContext } from '../../../contexts/ThemeContext'
import { useRules } from '../../../hooks/useRules'
import { useBudget } from '../../../hooks/useBudget'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

function SectionCard({
  title,
  children,
  isDark,
}: {
  title: string
  children: React.ReactNode
  isDark: boolean
}) {
  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: border,
        ...(isDark ? cardShadowDark : cardShadow),
      }}
    >
      <View style={{ marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: isDark ? '#a8a29e' : '#78716c',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  )
}

export default function RulesScreen() {
  const { isDark } = useThemeContext()
  const { rules, addRule, removeRule } = useRules()
  const { categories } = useBudget()

  const [pattern, setPattern] = useState('')
  const [source, setSource] = useState<'description' | 'category'>('description')
  const [targetCategoryId, setTargetCategoryId] = useState<string>('ignore')

  const bg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const segmentBg = isDark ? '#292524' : '#f5f5f4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'
  const inputBg = isDark ? '#292524' : '#fafaf9'

  const handleAddRule = () => {
    const p = pattern.trim()
    if (!p) return
    addRule({ pattern: p, source, targetCategoryId })
    setPattern('')
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
      <SectionCard title="Add rule" isDark={isDark}>
        <NativeTextField
          value={pattern}
          onChangeText={setPattern}
          placeholder="e.g. Audible or /^AMZN/"
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
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {(
            [
              { key: 'description' as const, label: 'Description' },
              { key: 'category' as const, label: 'Category' },
            ] as const
          ).map(({ key, label: l }) => (
            <Pressable
              key={key}
              onPress={() => setSource(key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: source === key ? segmentActive : 'transparent',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: source === key ? label : muted }}>{l}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setTargetCategoryId('ignore')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: targetCategoryId === 'ignore' ? segmentActive : 'transparent',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: targetCategoryId === 'ignore' ? label : muted }}>
              Ignore
            </Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setTargetCategoryId(cat.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: targetCategoryId === cat.id ? '#0ea5e9' : segmentBg,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: targetCategoryId === cat.id ? '#fff' : label }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <NativeButton
          label="Add rule"
          onPress={handleAddRule}
          fallbackBackgroundColor="#0ea5e9"
          fallbackTextColor="#ffffff"
        />
      </SectionCard>

      {rules.map((rule) => (
        <View
          key={rule.id}
          style={{
            backgroundColor: bg,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: border,
            ...(isDark ? cardShadowDark : cardShadow),
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: label, marginBottom: 4 }}>{rule.pattern}</Text>
          <Text style={{ fontSize: 13, color: muted, marginBottom: 10 }}>
            match {rule.source} →{' '}
            {rule.targetCategoryId === 'ignore'
              ? 'Ignore'
              : categories.find((c) => c.id === rule.targetCategoryId)?.name ?? rule.targetCategoryId}
          </Text>
          <NativeButton
            label="Remove"
            role="destructive"
            onPress={() => removeRule(rule.id)}
            fallbackBackgroundColor="#ef4444"
            fallbackTextColor="#ffffff"
            fallbackAlign="flex-start"
            containerStyle={{ alignSelf: 'flex-start' }}
          />
        </View>
      ))}
    </ScrollView>
  )
}
