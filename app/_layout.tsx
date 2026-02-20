import { Stack, usePathname, useRouter } from 'expo-router'
import { Pressable, SafeAreaView, Text, View } from 'react-native'
import { LayoutDashboard, Receipt, Settings as SettingsIcon } from 'lucide-react-native'
import { ThemeProvider } from '../contexts/ThemeContext'
import { MonthProvider } from '../contexts/MonthContext'
import { MonthSelector } from '../components/MonthSelector'
import { initDb } from '../lib/db'
import { useEffect } from 'react'
import { syncFromCloudIfAvailable } from '../lib/cloudSync'

function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const showMonthSelector = pathname === '/' || pathname === '/expenses'

  const Item = ({
    icon,
    label,
    path,
  }: {
    icon: React.ReactNode
    label: string
    path: '/' | '/expenses' | '/settings'
  }) => {
    const active = pathname === path
    return (
      <Pressable
        onPress={() => router.push(path)}
        className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${
          active ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-transparent'
        }`}
      >
        {icon}
        <Text className="text-sm text-zinc-700 dark:text-zinc-200">{label}</Text>
      </Pressable>
    )
  }

  return (
    <View className="border-b border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          <Item icon={<LayoutDashboard size={16} color="#71717a" />} label="Dashboard" path="/" />
          <Item icon={<Receipt size={16} color="#71717a" />} label="Transactions" path="/expenses" />
        </View>
        <Item icon={<SettingsIcon size={16} color="#71717a" />} label="Settings" path="/settings" />
      </View>
      {showMonthSelector ? <MonthSelector /> : null}
    </View>
  )
}

export default function RootLayout() {
  useEffect(() => {
    initDb().then(() => syncFromCloudIfAvailable())
  }, [])

  return (
    <ThemeProvider>
      <MonthProvider>
        <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
          <Header />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </MonthProvider>
    </ThemeProvider>
  )
}
