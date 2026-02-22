import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { Sun, Moon, Smartphone } from 'lucide-react-native'
import { useThemeContext } from '../../../contexts/ThemeContext'
import type { Theme } from '../../../hooks/useTheme'
import {
  getICloudSyncEnabled,
  getLastSyncState,
  isICloudAvailable,
  setICloudSyncEnabled,
  type LastSyncState,
} from '../../../lib/cloudSync'
import { Card } from '../../../components/Card'
import { hapticSelection } from '../../../lib/haptics'

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

const navRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingVertical: 10,
  paddingHorizontal: 0,
}

function NavRow({
  label,
  href,
  onPress,
  isDark,
}: {
  label: string
  href?: string
  onPress?: () => void
  isDark: boolean
}) {
  const labelColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  if (href != null) {
    return (
      <Link
        href={href as './rules' | './budget' | './privacy' | './dev-menu'}
        style={{ paddingVertical: 10 }}
        onPress={hapticSelection}
      >
        <View style={navRowStyle}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: labelColor }}>{label}</Text>
          <Text style={{ fontSize: 15, color: muted }}>→</Text>
        </View>
      </Link>
    )
  }
  const content = (
    <>
      <Text style={{ fontSize: 16, fontWeight: '500', color: labelColor }}>{label}</Text>
      <Text style={{ fontSize: 15, color: muted }}>→</Text>
    </>
  )
  return (
    <Pressable
      onPress={() => {
        hapticSelection()
        onPress?.()
      }}
      hitSlop={10}
      style={navRowStyle}
    >
      {content}
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
            onPress={() => {
              hapticSelection()
              onChange(v)
            }}
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
  const [syncEnabled, setSyncEnabled] = useState<boolean>(false)
  const [syncEnabledLoading, setSyncEnabledLoading] = useState(true)

  const loadSyncState = useCallback(async () => {
    const [state, available, enabled] = await Promise.all([
      getLastSyncState(),
      isICloudAvailable(),
      getICloudSyncEnabled(),
    ])
    setLastSync(state)
    setICloudAvailable(available)
    setSyncEnabled(enabled)
    setSyncEnabledLoading(false)
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
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{
        padding: 12,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Card
        title="Appearance"
        isDark={isDark}
        headerRight={
          <AppearanceIconSelector value={theme} onChange={setTheme} isDark={isDark} />
        }
      />

      <Card
        title="iCloud Sync"
        isDark={isDark}
        headerRight={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                        ? syncEnabled
                          ? '#22c55e'
                          : '#eab308'
                        : '#ef4444',
                }}
              />
              <Text style={{ fontSize: 12, color: muted }}>
                {iCloudAvailable === null
                  ? 'Checking…'
                  : !iCloudAvailable
                    ? 'Unavailable'
                    : syncEnabled
                      ? 'Available'
                      : 'Disabled'}
              </Text>
            </View>
            {iCloudAvailable !== false && (
              <Switch
                value={syncEnabled}
                onValueChange={async (value) => {
                  await setICloudSyncEnabled(value)
                  setSyncEnabled(value)
                }}
                disabled={syncEnabledLoading}
                trackColor={{ false: isDark ? '#44403c' : '#d6d3d1', true: isDark ? '#22c55e' : '#4ade80' }}
                thumbColor={isDark ? '#fafaf9' : '#ffffff'}
              />
            )}
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
          {iCloudAvailable !== false && !syncEnabled && (
            <Text style={{ fontSize: 14, color: muted }}>
              Sync is off. Turn on to use Push/Pull in the Dev menu and to pull from iCloud on app launch.
            </Text>
          )}
          {syncEnabled && (
            <Text style={{ fontSize: 14, color: muted }}>
              Last sync: {formatSyncTime(lastSyncTime)}
            </Text>
          )}
        </View>
      </Card>

      <Card title="Manage" isDark={isDark}>
        <NavRow label="Rules" onPress={() => router.push('/settings/rules')} isDark={isDark} />
        <NavRow label="Budget" onPress={() => router.push('/settings/budget')} isDark={isDark} />
      </Card>

      <Card title="More" isDark={isDark}>
        <NavRow label="Privacy Policy" onPress={() => router.push('/settings/privacy')} isDark={isDark} />
        <NavRow
          label="Feedback & Feature Requests"
          onPress={() => Linking.openURL('https://openbudget.userjot.com/?cursor=1&order=top&limit=10')}
          isDark={isDark}
        />
        <NavRow label="Advanced Menu" onPress={() => router.push('/settings/dev-menu')} isDark={isDark} />
      </Card>
    </ScrollView>
  )
}
