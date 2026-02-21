import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Sun, Moon, Smartphone } from 'lucide-react-native'
import { useThemeContext } from '../../../contexts/ThemeContext'
import type { Theme } from '../../../hooks/useTheme'
import { getLastSyncState, isICloudAvailable, type LastSyncState } from '../../../lib/cloudSync'

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
  children?: React.ReactNode
  isDark: boolean
}) {
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const bg = isDark ? '#1c1917' : '#ffffff'
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: children != null ? 10 : 0,
        }}
      >
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

function NavRow({
  label,
  onPress,
  isDark,
}: {
  label: string
  onPress: () => void
  isDark: boolean
}) {
  const labelColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 0,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: labelColor }}>{label}</Text>
      <Text style={{ fontSize: 15, color: muted }}>→</Text>
    </Pressable>
  )
}

const ICON_SIZE = 20

function AppearanceIconSelector({
  value,
  onChange,
  isDark,
}: {
  value: Theme
  onChange: (value: Theme) => void
  isDark: boolean
}) {
  const segmentBg = isDark ? '#292524' : '#f5f5f4'
  const segmentActive = isDark ? '#44403c' : '#e7e5e4'
  const iconMuted = isDark ? '#78716c' : '#a8a29e'
  const iconActive = isDark ? '#fafaf9' : '#1c1917'
  const options: { value: Theme; Icon: typeof Sun }[] = [
    { value: 'light', Icon: Sun },
    { value: 'dark', Icon: Moon },
    { value: 'system', Icon: Smartphone },
  ]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {options.map(({ value: v, Icon }) => {
        const selected = v === value
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? segmentActive : segmentBg,
            }}
          >
            <Icon size={ICON_SIZE} color={selected ? iconActive : iconMuted} />
          </Pressable>
        )
      })}
    </View>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { theme, setTheme, isDark } = useThemeContext()

  const [lastSync, setLastSync] = useState<LastSyncState>({})
  const [iCloudAvailable, setICloudAvailable] = useState<boolean | null>(null)

  const loadSyncState = useCallback(async () => {
    const [state, available] = await Promise.all([getLastSyncState(), isICloudAvailable()])
    setLastSync(state)
    setICloudAvailable(available)
  }, [])

  useEffect(() => {
    loadSyncState()
  }, [loadSyncState])

  const lastSyncTime = useMemo(() => {
    const push = lastSync.lastPushAt ? new Date(lastSync.lastPushAt).getTime() : 0
    const pull = lastSync.lastPullAt ? new Date(lastSync.lastPullAt).getTime() : 0
    const latest = Math.max(push, pull)
    return latest ? new Date(latest).toISOString() : undefined
  }, [lastSync.lastPushAt, lastSync.lastPullAt])

  const muted = isDark ? '#a8a29e' : '#78716c'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#0c0a09' : '#fafaf9' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 12,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard
        title="Appearance"
        isDark={isDark}
        headerRight={
          <AppearanceIconSelector value={theme} onChange={setTheme} isDark={isDark} />
        }
      />

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
          {iCloudAvailable === false && (
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
          <Text style={{ fontSize: 14, color: muted }}>
            Last sync: {formatSyncTime(lastSyncTime)}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="Manage" isDark={isDark}>
        <NavRow label="Rules" onPress={() => router.push('/settings/rules')} isDark={isDark} />
        <NavRow label="Budget" onPress={() => router.push('/settings/budget')} isDark={isDark} />
      </SectionCard>

      <SectionCard title="Advanced" isDark={isDark}>
        <NavRow label="Dev menu" onPress={() => router.push('/settings/dev-menu')} isDark={isDark} />
      </SectionCard>
    </ScrollView>
  )
}
