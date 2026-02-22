import { Pressable, Text, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { hapticSelection } from '../../lib/haptics'

type SegmentedOption<T extends string | number> = {
  label: string
  value: T
}

type NativeSegmentedPickerProps<T extends string | number> = {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  containerStyle?: ViewStyle
  fallbackBackgroundColor?: string
  fallbackSelectedBackgroundColor?: string
  fallbackTextColor?: string
  fallbackSelectedTextColor?: string
}

const isIOS = process.env.EXPO_OS === 'ios'

export function NativeSegmentedPicker<T extends string | number>({
  value,
  options,
  onChange,
  containerStyle,
  fallbackBackgroundColor = '#f1f5f9',
  fallbackSelectedBackgroundColor = '#e2e8f0',
  fallbackTextColor = '#475569',
  fallbackSelectedTextColor = '#0f172a',
}: NativeSegmentedPickerProps<T>) {
  if (isIOS) {
    return (
      <Host matchContents style={containerStyle}>
        <Picker<T>
          selection={value}
          onSelectionChange={(next) => {
            hapticSelection()
            onChange(next)
          }}
          modifiers={[pickerStyle('segmented')]}
        >
          {options.map((option) => (
            <SwiftText key={String(option.value)} modifiers={[tag(option.value)]}>
              {option.label}
            </SwiftText>
          ))}
        </Picker>
      </Host>
    )
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          borderRadius: 10,
          padding: 4,
          backgroundColor: fallbackBackgroundColor,
        },
        containerStyle,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => {
              hapticSelection()
              onChange(option.value)
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: selected ? fallbackSelectedBackgroundColor : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: selected ? fallbackSelectedTextColor : fallbackTextColor,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
