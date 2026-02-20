import { Pressable, Text, View } from 'react-native'
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
  const { selectedMonth, setSelectedMonth } = useMonth()
  const { isDark } = useThemeContext()
  const isCurrentMonth = selectedMonth === currentMonthKey()
  const canGoNext = selectedMonth < currentMonthKey()

  const bg = isDark ? '#292524' : '#fff'
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const textColor = isDark ? '#fafaf9' : '#1c1917'
  const iconColor = isDark ? '#a8a29e' : '#57534e'

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Pressable
        onPress={() => setSelectedMonth((m) => prevMonthKey(m))}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          padding: 10,
        }}
      >
        <ChevronLeft size={18} color={iconColor} />
      </Pressable>
      <Text
        selectable
        style={{
          minWidth: 160,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: '500',
          color: textColor,
        }}
      >
        {formatMonthLabel(selectedMonth)}
        {isCurrentMonth ? ' (current)' : ''}
      </Text>
      <Pressable
        onPress={() => canGoNext && setSelectedMonth((m) => nextMonthKey(m))}
        disabled={!canGoNext}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          padding: 10,
          opacity: canGoNext ? 1 : 0.4,
        }}
      >
        <ChevronRight size={18} color={iconColor} />
      </Pressable>
    </View>
  )
}
