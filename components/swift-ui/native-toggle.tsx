import { Switch, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Host, Toggle } from '@expo/ui/swift-ui'

type NativeToggleProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  label?: string
  containerStyle?: ViewStyle
  trackColor?: { false?: string; true?: string }
  thumbColor?: string
}

const isIOS = process.env.EXPO_OS === 'ios'

export function NativeToggle({
  value,
  onValueChange,
  label,
  containerStyle,
  trackColor,
  thumbColor,
}: NativeToggleProps) {
  if (isIOS) {
    return (
      <Host matchContents style={containerStyle}>
        <Toggle isOn={value} label={label} onIsOnChange={onValueChange} />
      </Host>
    )
  }

  return (
    <View style={containerStyle}>
      <Switch value={value} onValueChange={onValueChange} trackColor={trackColor} thumbColor={thumbColor} />
    </View>
  )
}
