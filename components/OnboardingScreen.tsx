import { ScrollView, Text, View, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { FileSpreadsheet, Settings, Sparkles } from 'lucide-react-native'
import { useThemeContext } from '../contexts/ThemeContext'

export function OnboardingScreen() {
  const { isDark } = useThemeContext()

  const bg = isDark ? '#0c0a09' : '#fafaf9'
  const cardBg = isDark ? '#1c1917' : '#fff'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#fafaf9' : '#1c1917'
  const bodyColor = isDark ? '#d6d3d1' : '#44403c'
  const mutedColor = isDark ? '#a8a29e' : '#78716c'
  const accent = '#0d9488'
  const accentSoft = isDark ? 'rgba(13, 148, 136, 0.25)' : 'rgba(13, 148, 136, 0.12)'
  const cardShadow = isDark ? { boxShadow: '0 1px 3px rgba(0,0,0,0.4)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Sparkles size={36} color={accent} />
        </View>
        <Text
          selectable
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: titleColor,
            letterSpacing: -0.5,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Welcome to OpenBudget
        </Text>
        <Text
          selectable
          style={{
            fontSize: 16,
            color: bodyColor,
            textAlign: 'center',
            lineHeight: 24,
            maxWidth: 320,
          }}
        >
          Your budget, your data, open source and free. No bank sync, no subscription. Let’s get you set up.
        </Text>
      </View>

      {/* Why no bank sync */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 18,
          borderWidth: 1,
          borderColor: border,
          ...cardShadow,
        }}
      >
        <Text
          selectable
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: titleColor,
            marginBottom: 8,
          }}
        >
          Why no bank connection?
        </Text>
        <Text
          selectable
          style={{
            fontSize: 15,
            color: bodyColor,
            lineHeight: 22,
          }}
        >
          OpenBudget is open source and free to use. We don’t sync with your bank — so your data stays on your device and you stay in control. Import your transactions from your bank’s CSV export whenever you like.
        </Text>
      </View>

      {/* Step 1: Import transactions */}
      <Link href="/(tabs)/expenses" asChild>
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: cardBg,
            borderRadius: 16,
            borderCurve: 'continuous',
            padding: 18,
            borderWidth: 2,
            borderColor: accent,
            opacity: pressed ? 0.85 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            ...cardShadow,
          })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileSpreadsheet size={26} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: titleColor,
                marginBottom: 4,
              }}
            >
              Import your transactions
            </Text>
            <Text
              selectable
              style={{
                fontSize: 14,
                color: mutedColor,
                lineHeight: 20,
              }}
            >
              Head to Transactions and import a CSV from your bank. We’ll help you categorize as you go.
            </Text>
          </View>
        </Pressable>
      </Link>

      {/* Step 2: Set up budget & rules */}
      <Link href="/(tabs)/settings" asChild>
        <Pressable
          style={({ pressed }) => ({
          backgroundColor: cardBg,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 18,
          borderWidth: 1,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          ...cardShadow,
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={26} color={mutedColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: titleColor,
              marginBottom: 4,
            }}
          >
            Set up your budget
          </Text>
          <Text
            selectable
            style={{
              fontSize: 14,
              color: mutedColor,
              lineHeight: 20,
            }}
          >
            In Settings, add budget categories and categorization rules so future imports get sorted automatically.
          </Text>
        </View>
        </Pressable>
      </Link>
    </ScrollView>
  )
}
