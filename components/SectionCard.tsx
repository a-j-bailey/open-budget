import { Text, View } from 'react-native'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'

const cardShadow = { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
const cardShadowDark = { boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }

export type SectionCardProps = {
  title: string
  headerRight?: React.ReactNode
  children?: React.ReactNode
  isDark: boolean
}

export function SectionCard({ title, headerRight, children, isDark }: SectionCardProps) {
  const useGlass = isGlassEffectAPIAvailable()
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const bg = isDark ? '#1c1917' : '#ffffff'
  const titleColor = isDark ? '#a8a29e' : '#78716c'

  const containerStyle = {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: border,
    ...(useGlass ? {} : { backgroundColor: bg, ...(isDark ? cardShadowDark : cardShadow) }),
  }

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: children != null ? 10 : 0,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: titleColor,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {title}
      </Text>
      {headerRight}
    </View>
  )

  const content = (
    <>
      {header}
      {children}
    </>
  )

  if (useGlass) {
    return (
      <GlassView
        style={containerStyle}
        colorScheme={isDark ? 'dark' : 'light'}
        glassEffectStyle="regular"
      >
        {content}
      </GlassView>
    )
  }

  return <View style={containerStyle}>{content}</View>
}
