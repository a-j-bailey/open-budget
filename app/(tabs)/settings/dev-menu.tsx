import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { NativeButton } from '../../../components/swift-ui'
import { useThemeContext } from '../../../contexts/ThemeContext'
import {
  getICloudSyncEnabled,
  getLastSyncState,
  isICloudAvailable,
  pushCloudSnapshot,
  syncFromCloudIfAvailable,
  type LastSyncState,
} from '../../../lib/cloudSync'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

function SectionCard({
  title,
  headerRight,
  children,
  isDark,
}: {
  title: string
  headerRight?: React.ReactNode
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
        {headerRight}
      </View>
      {children}
    </View>
  )
}

function formatSyncTime(iso: string | undefined) {
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

export default function DevMenuScreen() {
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const router = useRouter()
  const { isDark } = useThemeContext()
  const syncColumnWidth = useMemo(
    () => Math.floor((windowWidth - 12 * 2 - 14 * 2 - 10) / 2),
    [windowWidth]
  )

  const [pushLoading, setPushLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [lastSync, setLastSync] = useState<LastSyncState>({})
  const [iCloudAvailable, setICloudAvailable] = useState<boolean | null>(null)
  const [syncEnabled, setSyncEnabled] = useState<boolean>(false)
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const loadSyncState = useCallback(async () => {
    const [state, available, enabled] = await Promise.all([
      getLastSyncState(),
      isICloudAvailable(),
      getICloudSyncEnabled(),
    ])
    setLastSync(state)
    setICloudAvailable(available)
    setSyncEnabled(enabled)
  }, [])

  useEffect(() => {
    loadSyncState()
  }, [loadSyncState])

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

  const muted = isDark ? '#a8a29e' : '#78716c'
  const label = isDark ? '#fafaf9' : '#1c1917'

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
      <SectionCard
        title="iCloud Sync"
        isDark={isDark}
        headerRight={
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
            <Text style={{ fontSize: 12, color: muted }}>
              {iCloudAvailable === null
                ? 'Checking…'
                : iCloudAvailable
                  ? 'Available'
                  : 'Unavailable'}
            </Text>
          </View>
        }
      >
        <View style={{ gap: 12 }}>
          {!syncEnabled && (
            <Text style={{ fontSize: 14, color: muted }}>
              iCloud sync is off. Enable it in Settings to use Push/Pull here.
            </Text>
          )}
          {syncEnabled && iCloudAvailable === false && (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.25)',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#fcd34d' : '#b45309',
                  lineHeight: 20,
                }}
              >
                iCloud is unavailable. Sign in with your Apple ID in Settings → [your name], and make sure iCloud Drive is turned on.
              </Text>
            </View>
          )}
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

          {syncEnabled && iCloudAvailable === true && (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <NativeButton
                  label={pushLoading ? 'Pushing…' : 'Push to iCloud'}
                  onPress={handlePush}
                  disabled={pushLoading || pullLoading}
                  iosButtonStyle="borderedProminent"
                  fallbackBackgroundColor={pushLoading ? '#94a3b8' : '#0ea5e9'}
                  fallbackTextColor="#ffffff"
                  containerStyle={{ flex: 1 }}
                />
                <NativeButton
                  label={pullLoading ? 'Pulling…' : 'Pull from iCloud'}
                  onPress={handlePull}
                  disabled={pushLoading || pullLoading}
                  iosButtonStyle="borderedProminent"
                  fallbackBackgroundColor={pullLoading ? '#94a3b8' : '#10b981'}
                  fallbackTextColor="#ffffff"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: syncColumnWidth }}>
                  <Text style={{ fontSize: 13, color: muted }}>
                    Last pushed: {formatSyncTime(lastSync.lastPushAt)}
                    {lastSync.lastPushCounts != null &&
                      ` · ${lastSync.lastPushCounts.categories} categories, ${lastSync.lastPushCounts.rules} rules, ${lastSync.lastPushCounts.expenses} expenses`}
                  </Text>
                </View>
                <View style={{ width: syncColumnWidth }}>
                  <Text style={{ fontSize: 13, color: muted }}>
                    Last pulled: {formatSyncTime(lastSync.lastPullAt)}
                    {lastSync.lastPullCounts != null &&
                      ` · ${lastSync.lastPullCounts.categories} categories, ${lastSync.lastPullCounts.rules} rules, ${lastSync.lastPullCounts.expenses} expenses`}
                  </Text>
                </View>
              </View>
            </>
          )}
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
    </ScrollView>
  )
}
