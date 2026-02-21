import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext'
import { MonthProvider } from '../contexts/MonthContext'
import { initDb } from '../lib/db'
import { useEffect } from 'react'
import { syncFromCloudIfAvailable } from '../lib/cloudSync'

function RootLayoutInner() {
  const { isDark } = useThemeContext()
  const bg = isDark ? '#0c0a09' : '#fafaf9'

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack screenOptions={{ headerShown: false }} />
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
