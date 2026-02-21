import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import {
  currentMonthKey,
  formatMonthLabel,
  nextMonthKey,
  prevMonthKey,
  useMonth,
} from '../contexts/MonthContext'
import { useThemeContext } from '../contexts/ThemeContext'

export function MonthSelector() {
  const insets = useSafeAreaInsets()
  const { selectedMonth, setSelectedMonth } = useMonth()
  const { isDark } = useThemeContext()
  const isCurrentMonth = selectedMonth === currentMonthKey()
  const canGoNext = selectedMonth < currentMonthKey()

  const bg = isDark ? '#292524' : '#fff'
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const textColor = isDark ? '#fafaf9' : '#1c1917'
  const iconColor = isDark ? '#a8a29e' : '#57534e'

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginRight: 12,
      }}
    >
      <Pressable
        onPress={() => setSelectedMonth((m) => prevMonthKey(m))}
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          padding: 6,
        }}
      >
        <ChevronLeft size={16} color={iconColor} />
      </Pressable>
      <Text
        selectable
        style={{
          minWidth: 100,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: '500',
          color: textColor,
        }}
      >
        {formatMonthLabel(selectedMonth)}
        {isCurrentMonth ? ' ·' : ''}
      </Text>
      <Pressable
        onPress={() => canGoNext && setSelectedMonth((m) => nextMonthKey(m))}
        disabled={!canGoNext}
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          padding: 6,
          opacity: canGoNext ? 1 : 0.4,
        }}
      >
        <ChevronRight size={16} color={iconColor} />
      </Pressable>
    </View>
  )
}
