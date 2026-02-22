import { Stack } from 'expo-router'
import { useThemeContext } from '../../../contexts/ThemeContext'

export default function SettingsLayout() {
  const { isDark } = useThemeContext()
  const screenBg = isDark ? '#0c0a09' : '#fafaf9'
  const headerTint = isDark ? '#fafaf9' : '#1c1917'

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: screenBg },
        headerShown: true,
        headerStyle: { backgroundColor: screenBg },
        headerTitleStyle: { color: headerTint, fontWeight: '700' },
        headerTintColor: headerTint,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="rules"
        options={{ title: 'Rules' }}
      />
      <Stack.Screen
        name="budget"
        options={{ title: 'Budget' }}
      />
      <Stack.Screen
        name="privacy"
        options={{ title: 'Privacy' }}
      />
      <Stack.Screen
        name="dev-menu"
        options={{ title: 'Dev menu' }}
      />
    </Stack>
  )
}
