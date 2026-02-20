import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'react-native'
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'household-theme'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme(): {
  theme: Theme
  isDark: boolean
  setTheme: (t: Theme) => void
} {
  const system = useColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        setThemeState(raw)
      }
    })
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }

  const isDark = useMemo(() => {
    if (theme === 'system') return system === 'dark'
    return theme === 'dark'
  }, [system, theme])

  return { theme, isDark, setTheme }
}
