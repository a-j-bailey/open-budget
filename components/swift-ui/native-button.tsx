import { Pressable, Text, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { Button as SwiftButton, Host } from '@expo/ui/swift-ui'
import { buttonStyle as swiftButtonStyle, disabled as swiftDisabled } from '@expo/ui/swift-ui/modifiers'
import { hapticImpact, hapticImpactLight } from '../../lib/haptics'

type NativeButtonRole = 'default' | 'cancel' | 'destructive'

type NativeButtonProps = {
  label: string
  onPress?: () => void
  role?: NativeButtonRole
  disabled?: boolean
  containerStyle?: ViewStyle
  iosButtonStyle?: 'bordered' | 'borderedProminent' | 'borderless' | 'plain'
  fallbackBackgroundColor?: string
  fallbackTextColor?: string
  fallbackAlign?: 'center' | 'flex-start' | 'flex-end'
}

const isIOS = process.env.EXPO_OS === 'ios'

export function NativeButton({
  label,
  onPress,
  role = 'default',
  disabled = false,
  containerStyle,
  iosButtonStyle,
  fallbackBackgroundColor = 'transparent',
  fallbackTextColor = '#0a84ff',
  fallbackAlign = 'center',
}: NativeButtonProps) {
  const handlePress = () => {
    if (role === 'cancel') hapticImpactLight()
    else hapticImpact()
    onPress?.()
  }
  if (isIOS) {
    return (
      <Host matchContents style={containerStyle}>
        <SwiftButton
          label={label}
          role={role}
          onPress={handlePress}
          modifiers={[
            ...(iosButtonStyle ? [swiftButtonStyle(iosButtonStyle)] : []),
            ...(disabled ? [swiftDisabled(true)] : []),
          ]}
        />
      </Host>
    )
  }

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => ({
          minHeight: 36,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 8,
          alignItems: fallbackAlign,
          justifyContent: 'center',
          backgroundColor: fallbackBackgroundColor,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: role === 'default' ? '600' : '500',
            color: role === 'destructive' ? '#ff3b30' : fallbackTextColor,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  )
}
