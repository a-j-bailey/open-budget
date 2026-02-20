import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useThemeContext } from '../../contexts/ThemeContext'
import type { Theme } from '../../hooks/useTheme'
import { useRules } from '../../hooks/useRules'
import { useBudget } from '../../hooks/useBudget'
import {
  getLastSyncState,
  isICloudAvailable,
  pushCloudSnapshot,
  syncFromCloudIfAvailable,
  type LastSyncState,
} from '../../lib/cloudSync'

type TabId = 'settings' | 'rules' | 'budget'

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
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
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
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isDark ? '#a8a29e' : '#78716c',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('settings')
  const { theme, setTheme, isDark } = useThemeContext()
  const { rules, addRule, removeRule } = useRules()
  const { categories, addCategory, updateCategory, removeCategory } = useBudget()

  const [pattern, setPattern] = useState('')
  const [source, setSource] = useState<'description' | 'category'>('description')
  const [targetCategoryId, setTargetCategoryId] = useState<string>('ignore')

  const [newName, setNewName] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [viewMode, setViewMode] = useState<'debit' | 'credit'>('debit')

  const [pushLoading, setPushLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [lastSync, setLastSync] = useState<LastSyncState>({})
  const [iCloudAvailable, setICloudAvailable] = useState<boolean | null>(null)
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const loadSyncState = useCallback(async () => {
    const [state, available] = await Promise.all([getLastSyncState(), isICloudAvailable()])
    setLastSync(state)
    setICloudAvailable(available)
  }, [])

  useEffect(() => {
    if (activeTab === 'settings') loadSyncState()
  }, [activeTab, loadSyncState])

  const showSyncMessage = useCallback((text: string, isError: boolean) => {
    setSyncMessage({ text, isError })
    const t = setTimeout(() => setSyncMessage(null), 5000)
    return () => clearTimeout(t)
  }, [])

  const handlePush = useCallback(async () => {
    if (pushLoading) return
    setPushLoading(true)
    setSyncMessage(null)
    try {
      const result = await pushCloudSnapshot()
      await loadSyncState()
      if (result.success) {
        const { counts } = result
        showSyncMessage(
          counts
            ? `Pushed ${counts.categories} categories, ${counts.rules} rules, ${counts.expenses} expenses`
            : 'Pushed to iCloud',
          false
        )
      } else {
        showSyncMessage(result.error ?? 'Push failed', true)
      }
    } finally {
      setPushLoading(false)
    }
  }, [pushLoading, loadSyncState, showSyncMessage])

  const handlePull = useCallback(async () => {
    if (pullLoading) return
    setPullLoading(true)
    setSyncMessage(null)
    try {
      const result = await syncFromCloudIfAvailable()
      await loadSyncState()
      if (result.success) {
        const { counts } = result
        showSyncMessage(
          counts
            ? `Pulled ${counts.categories} categories, ${counts.rules} rules, ${counts.expenses} expenses`
            : 'Pulled from iCloud',
          false
        )
      } else {
        showSyncMessage(result.error ?? 'Pull failed', true)
      }
    } finally {
      setPullLoading(false)
    }
  }, [pullLoading, loadSyncState, showSyncMessage])

  const formatSyncTime = (iso: string | undefined) => {
    if (!iso) return 'Never'
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      if (diffMs < 60_000) return 'Just now'
      if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`
      if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    } catch {
      return iso
    }
  }

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

  const setThemeValue = (value: Theme) => setTheme(value)

  const handleAddRule = () => {
    const p = pattern.trim()
    if (!p) return
    addRule({ pattern: p, source, targetCategoryId })
    setPattern('')
  }

  const handleAddCategory = () => {
    const name = newName.trim()
    const limit = parseFloat(newLimit)
    if (!name || Number.isNaN(limit) || limit < 0) return
    addCategory(name, limit, viewMode === 'credit' ? 'income' : 'expense')
    setNewName('')
    setNewLimit('')
  }

  const tabs: TabId[] = ['settings', 'rules', 'budget']

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: label,
          letterSpacing: -0.6,
          marginBottom: 6,
        }}
      >
        Settings
      </Text>

      {/* Segmented control: Settings / Rules / Budget */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: segmentBg,
          borderRadius: 10,
          padding: 4,
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: activeTab === tab ? segmentActive : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: activeTab === tab ? label : muted,
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'settings' && (
        <>
          <SectionCard title="Appearance" isDark={isDark}>
            <View style={{ flexDirection: 'row', backgroundColor: segmentBg, borderRadius: 10, padding: 4, gap: 0 }}>
              {(['light', 'dark', 'system'] as Theme[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setThemeValue(option)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: theme === option ? '#0ea5e9' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: theme === option ? '#fff' : label,
                    }}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="iCloud Sync" isDark={isDark}>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      iCloudAvailable === null
                        ? muted
                        : iCloudAvailable
                          ? '#22c55e'
                          : '#ef4444',
                  }}
                />
                <Text style={{ fontSize: 14, color: muted }}>
                  {iCloudAvailable === null
                    ? 'Checking iCloud…'
                    : iCloudAvailable
                      ? 'iCloud available'
                      : 'iCloud unavailable (sign in or enable iCloud Drive)'}
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, color: muted }}>
                  Last pushed: {formatSyncTime(lastSync.lastPushAt)}
                  {lastSync.lastPushCounts &&
                    ` · ${lastSync.lastPushCounts.categories} categories, ${lastSync.lastPushCounts.rules} rules, ${lastSync.lastPushCounts.expenses} expenses`}
                </Text>
                <Text style={{ fontSize: 13, color: muted }}>
                  Last pulled: {formatSyncTime(lastSync.lastPullAt)}
                  {lastSync.lastPullCounts &&
                    ` · ${lastSync.lastPullCounts.categories} categories, ${lastSync.lastPullCounts.rules} rules, ${lastSync.lastPullCounts.expenses} expenses`}
                </Text>
              </View>

              {syncMessage && (
                <View
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: syncMessage.isError
                      ? (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)')
                      : (isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)'),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: syncMessage.isError
                        ? (isDark ? '#fca5a5' : '#b91c1c')
                        : (isDark ? '#86efac' : '#15803d'),
                    }}
                  >
                    {syncMessage.text}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={handlePush}
                  disabled={pushLoading || pullLoading}
                  style={{
                    flex: 1,
                    backgroundColor: pushLoading ? '#94a3b8' : '#0ea5e9',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 48,
                  }}
                >
                  {pushLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Push to iCloud</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={handlePull}
                  disabled={pushLoading || pullLoading}
                  style={{
                    flex: 1,
                    backgroundColor: pullLoading ? '#94a3b8' : '#10b981',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 48,
                  }}
                >
                  {pullLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Pull from iCloud</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Data" isDark={isDark}>
            <Pressable
              onPress={() => router.push('/migrate')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingHorizontal: 0,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: label }}>Migrate from desktop app</Text>
              <Text style={{ fontSize: 15, color: muted }}>→</Text>
            </Pressable>
            <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>
              Import config, rules, and expense CSVs from the old desktop app.
            </Text>
          </SectionCard>
        </>
      )}

      {activeTab === 'rules' && (
        <>
          <SectionCard title="Add rule" isDark={isDark}>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g. Audible or /^AMZN/"
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
            <Pressable
              onPress={handleAddRule}
              style={{ backgroundColor: '#0ea5e9', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Add rule</Text>
            </Pressable>
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
              <Pressable
                onPress={() => removeRule(rule.id)}
                style={{ alignSelf: 'flex-start', backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {activeTab === 'budget' && (
        <>
          <SectionCard title="New category" isDark={isDark}>
            <View style={{ flexDirection: 'row', backgroundColor: segmentBg, borderRadius: 10, padding: 4, marginBottom: 10 }}>
              <Pressable
                onPress={() => setViewMode('debit')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: viewMode === 'debit' ? segmentActive : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: viewMode === 'debit' ? label : muted }}>Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('credit')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: viewMode === 'credit' ? segmentActive : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: viewMode === 'credit' ? label : muted }}>Income</Text>
              </Pressable>
            </View>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
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
              value={newLimit}
              onChangeText={setNewLimit}
              keyboardType="decimal-pad"
              placeholder={viewMode === 'credit' ? 'Expected amount' : 'Monthly limit'}
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
            <Pressable
              onPress={handleAddCategory}
              style={{ backgroundColor: '#0ea5e9', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Add category</Text>
            </Pressable>
          </SectionCard>

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
              <TextInput
                value={cat.name}
                onChangeText={(value) => updateCategory(cat.id, { name: value })}
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
                value={String(cat.monthlyLimit)}
                onChangeText={(value) => {
                  const next = parseFloat(value)
                  if (!Number.isNaN(next) && next >= 0) updateCategory(cat.id, { monthlyLimit: next })
                }}
                keyboardType="decimal-pad"
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: muted }}>
                  {cat.type === 'income' ? 'Income category' : 'Expense category'}
                </Text>
                <Pressable
                  onPress={() => removeCategory(cat.id)}
                  style={{ backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}
