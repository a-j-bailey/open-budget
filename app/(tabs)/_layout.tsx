import { Tabs } from 'expo-router'
import { LayoutDashboard, Receipt, Settings as SettingsIcon } from 'lucide-react-native'
import { useThemeContext } from '../../contexts/ThemeContext'
import { View } from 'react-native'
import { MonthSelector } from '@/components/MonthSelector'

export default function TabsLayout() {
  const { isDark } = useThemeContext()
  const activeTint = isDark ? '#e4e4e7' : '#3f3f46'
  const inactiveTint = isDark ? '#71717a' : '#a1a1aa'

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#0c0a09' : '#fafaf9'},
        headerTitleStyle: { 
          color: isDark ? '#e4e4e7' : '#3f3f46',
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: isDark ? '#0c0a09' : '#fafaf9',
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        tabBarLabelStyle: { fontSize: 12 },
        headerTitleAlign: 'left',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size ?? 24} color={color} />,
          sceneStyle: { backgroundColor: isDark ? '#0c0a09' : '#fafaf9' },
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Receipt size={size ?? 24} color={color} />,
          sceneStyle: { backgroundColor: isDark ? '#0c0a09' : '#fafaf9' },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size ?? 24} color={color} />,
          sceneStyle: { backgroundColor: isDark ? '#0c0a09' : '#fafaf9' },
        }}
      />
    </Tabs>
  )
}
