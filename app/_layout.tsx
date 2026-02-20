import { Stack, usePathname } from 'expo-router'
import { Text, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext'
import { MonthProvider } from '../contexts/MonthContext'
import { MonthSelector } from '../components/MonthSelector'
import { initDb } from '../lib/db'
import { useEffect } from 'react'
import { syncFromCloudIfAvailable } from '../lib/cloudSync'

function Header() {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { isDark } = useThemeContext()
  const showMonthSelector = pathname === '/' || pathname === '/expenses'

  const bg = isDark ? '#0c0a09' : '#fafaf9'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: border,
        backgroundColor: bg,
      }}
    >
      {showMonthSelector ? (
        <View style={{ marginTop: 10 }}>
          <MonthSelector />
        </View>
      ) : null}
    </View>
  )
}

function RootLayoutInner() {
  const { isDark } = useThemeContext()
  const bg = isDark ? '#0c0a09' : '#fafaf9'

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Header />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  )
}

export default function RootLayout() {
  useEffect(() => {
    initDb().then(() => syncFromCloudIfAvailable())
  }, [])

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MonthProvider>
          <RootLayoutInner />
        </MonthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
