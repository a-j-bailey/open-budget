import { Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import {
  currentMonthKey,
  formatMonthLabel,
  nextMonthKey,
  prevMonthKey,
  useMonth,
} from '../contexts/MonthContext'

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useMonth()
  const isCurrentMonth = selectedMonth === currentMonthKey()
  const canGoNext = selectedMonth < currentMonthKey()

  return (
    <View className="flex-row items-center justify-center gap-3">
      <Pressable
        onPress={() => setSelectedMonth((m) => prevMonthKey(m))}
        className="rounded-xl border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <ChevronLeft size={18} color="#71717a" />
      </Pressable>
      <Text className="min-w-[180px] text-center text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {formatMonthLabel(selectedMonth)}
        {isCurrentMonth ? ' (current)' : ''}
      </Text>
      <Pressable
        onPress={() => canGoNext && setSelectedMonth((m) => nextMonthKey(m))}
        disabled={!canGoNext}
        className="rounded-xl border border-zinc-300 bg-white p-2 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <ChevronRight size={18} color="#71717a" />
      </Pressable>
    </View>
  )
}
