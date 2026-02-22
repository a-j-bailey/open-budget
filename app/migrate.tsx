import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeContext } from '../contexts/ThemeContext'
import { hapticSelection } from '../lib/haptics'
import { runMigrationFromFiles } from '../lib/migration'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

export default function MigrateScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark } = useThemeContext()
  const [status, setStatus] = useState<string>('Select your old files to migrate.')
  const [isRunning, setIsRunning] = useState(false)

  const bg = isDark ? '#0c0a09' : '#fafaf9'
  const cardBg = isDark ? '#1c1917' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const label = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const iconColor = isDark ? '#fafaf9' : '#1c1917'

  const run = async () => {
    setIsRunning(true)
    setStatus('Selecting files...')
    const result = await runMigrationFromFiles()
    if (result.reason === 'canceled') {
      setStatus('Migration canceled.')
    } else if (result.reason === 'empty') {
      setStatus('No matching files found. Pick config.json, rules.json, and expense CSV files.')
    } else {
      setStatus('Migration complete. Your data is now in SQLite.')
    }
    setIsRunning(false)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back + title bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 24,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => {
            hapticSelection()
            router.back()
          }}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: isDark ? '#292524' : '#e7e5e4',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color={iconColor} />
        </Pressable>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: label,
            letterSpacing: -0.5,
          }}
        >
          Migrate Data
        </Text>
      </View>

      {/* Main card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 24,
          borderWidth: 1,
          borderColor: border,
          ...(isDark ? cardShadowDark : cardShadow),
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: muted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 8,
          }}
        >
          Desktop import
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: label,
            marginBottom: 12,
          }}
        >
          Import from old desktop app
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: muted,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          Bring in your existing config, rules, and monthly expense CSV files from the previous desktop app into this app’s SQLite database.
        </Text>

        <Pressable
          onPress={run}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? (isDark ? '#44403c' : '#a8a29e') : '#0ea5e9',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isRunning ? 0.9 : 1,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#fff',
            }}
          >
            {isRunning ? 'Selecting files…' : 'Select Files and Migrate'}
          </Text>
        </Pressable>

        <View
          style={{
            marginTop: 20,
            padding: 16,
            backgroundColor: isDark ? '#292524' : '#f5f5f4',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 14,
              color: muted,
              textAlign: 'center',
            }}
          >
            {status}
          </Text>
        </View>
      </View>

      {/* Hint list */}
      <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          You’ll need
        </Text>
        <View style={{ gap: 8 }}>
          {['config.json', 'rules.json', 'Expense CSV files'].map((item, i) => (
            <View
              key={item}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#292524' : '#e7e5e4',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: muted }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 15, color: label }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
