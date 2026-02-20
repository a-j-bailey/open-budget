import { useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import type { KeyboardTypeOptions, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { Host, TextField } from '@expo/ui/swift-ui'
import { multilineTextAlignment } from '@expo/ui/swift-ui/modifiers'

type NativeTextFieldProps = {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
  placeholderTextColor?: string
  align?: 'left' | 'center' | 'right'
}

const isIOS = process.env.EXPO_OS === 'ios'

function toSwiftKeyboardType(keyboardType: KeyboardTypeOptions | undefined) {
  if (keyboardType === 'decimal-pad') return 'decimal-pad'
  if (keyboardType === 'email-address') return 'email-address'
  if (keyboardType === 'numeric' || keyboardType === 'number-pad') return 'numeric'
  if (keyboardType === 'phone-pad') return 'phone-pad'
  if (keyboardType === 'url') return 'url'
  return 'default'
}

export function NativeTextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  align = 'left',
}: NativeTextFieldProps) {
  const lastNativeValue = useRef(value)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    if (value !== lastNativeValue.current) {
      lastNativeValue.current = value
      setResetKey((k) => k + 1)
    }
  }, [value])

  if (isIOS) {
    return (
      <Host key={resetKey} matchContents style={containerStyle}>
        <TextField
          defaultValue={lastNativeValue.current}
          placeholder={placeholder}
          keyboardType={toSwiftKeyboardType(keyboardType)}
          modifiers={[
            multilineTextAlignment(align === 'right' ? 'trailing' : align === 'center' ? 'center' : 'leading'),
          ]}
          onChangeText={(next) => {
            lastNativeValue.current = next
            onChangeText(next)
          }}
        />
      </Host>
    )
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={placeholderTextColor}
      style={[inputStyle, { textAlign: align }]}
    />
  )
}
