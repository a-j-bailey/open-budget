import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { vexo } from 'vexo-analytics'
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext'
import { MonthProvider } from '../contexts/MonthContext'
import { initDb } from '../lib/db'
import { getICloudSyncEnabled, syncFromCloudIfAvailable } from '../lib/cloudSync'

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
    const appId = process.env.EXPO_PUBLIC_VEXO_APP_ID
    if (appId) vexo(appId)
    initDb().then(async () => {
      const syncEnabled = await getICloudSyncEnabled()
      if (syncEnabled) await syncFromCloudIfAvailable()
    })
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
