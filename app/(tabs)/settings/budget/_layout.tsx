import { Stack } from 'expo-router'
import { useThemeContext } from '../../../../contexts/ThemeContext'

export default function BudgetLayout() {
  const { isDark } = useThemeContext()
  const screenBg = isDark ? '#0c0a09' : '#fafaf9'

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: screenBg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="category-form"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 1,
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          headerShown: false,
        }}
      />
    </Stack>
  )
}
