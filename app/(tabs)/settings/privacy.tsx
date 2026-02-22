import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { hapticSelection } from '../../../lib/haptics'
import { useThemeContext } from '../../../contexts/ThemeContext'

const PRIVACY_MD = require('../../../PRIVACY.md') as number

type ContentBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'p'; segments: { text: string; bold?: boolean; link?: string }[] }
  | { type: 'bullet'; segments: { text: string; bold?: boolean; link?: string }[] }
  | { type: 'hr' }
  | { type: 'blank' }

function parseInline(line: string): { text: string; bold?: boolean; link?: string }[] {
  const segments: { text: string; bold?: boolean; link?: string }[] = []
  let rest = line
  while (rest.length > 0) {
    const linkMatch = rest.match(/^\[([^\]]*)\]\((https?:\S+)\)/)
    const boldMatch = rest.match(/^\*\*([^*]+)\*\*/)
    if (linkMatch) {
      const [full, label, url] = linkMatch
      if (label) segments.push({ text: label, link: url })
      rest = rest.slice(full.length)
    } else if (boldMatch) {
      const [full, content] = boldMatch
      if (content) segments.push({ text: content, bold: true })
      rest = rest.slice(full.length)
    } else {
      const nextLink = rest.indexOf('[')
      const nextBold = rest.indexOf('**')
      let end = rest.length
      if (nextLink >= 0 && nextLink < end) end = nextLink
      if (nextBold >= 0 && nextBold < end) end = nextBold
      const plain = rest.slice(0, end)
      if (plain) segments.push({ text: plain })
      rest = rest.slice(end)
    }
  }
  return segments
}

function parseMarkdown(md: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = md.split(/\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') {
      blocks.push({ type: 'blank' })
      continue
    }
    if (trimmed === '---') {
      blocks.push({ type: 'hr' })
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).replace(/\*\*/g, '') })
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).replace(/\*\*/g, '') })
      continue
    }
    if (trimmed.startsWith('- ')) {
      blocks.push({ type: 'bullet', segments: parseInline(trimmed.slice(2)) })
      continue
    }
    blocks.push({ type: 'p', segments: parseInline(trimmed) })
  }
  return blocks
}

function RenderBlock({
  block,
  isDark,
}: {
  block: ContentBlock
  isDark: boolean
}) {
  const textColor = isDark ? '#fafaf9' : '#1c1917'
  const muted = isDark ? '#a8a29e' : '#78716c'
  const linkColor = isDark ? '#93c5fd' : '#2563eb'
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'

  if (block.type === 'blank') {
    return <View style={{ height: 8 }} />
  }
  if (block.type === 'hr') {
    return (
      <View
        style={{
          height: 1,
          backgroundColor: borderColor,
          marginVertical: 12,
        }}
      />
    )
  }
  if (block.type === 'h1') {
    return (
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: textColor,
          marginBottom: 8,
        }}
      >
        {block.text}
      </Text>
    )
  }
  if (block.type === 'h2') {
    return (
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: textColor,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        {block.text}
      </Text>
    )
  }
  if (block.type === 'p' || block.type === 'bullet') {
    const isBullet = block.type === 'bullet'
    return (
      <View style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: isBullet ? 16 : 0 }}>
        {isBullet && (
          <Text style={{ color: muted, fontSize: 15, marginRight: 6 }}>•</Text>
        )}
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {block.segments.map((seg, idx) => {
            if (seg.link) {
              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    hapticSelection()
                    Linking.openURL(seg.link!)
                  }}
                  style={{ marginRight: 2 }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: linkColor,
                      textDecorationLine: 'underline',
                    }}
                  >
                    {seg.text}
                  </Text>
                </Pressable>
              )
            }
            return (
              <Text
                key={idx}
                style={{
                  fontSize: 15,
                  color: textColor,
                  fontWeight: seg.bold ? '600' : '400',
                  lineHeight: 22,
                }}
              >
                {seg.text}
              </Text>
            )
          })}
        </View>
      </View>
    )
  }
  return null
}

async function loadMarkdownAsset(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId)
  await asset.downloadAsync()
  if (!asset.localUri) throw new Error('Asset has no localUri')
  const file = new File(asset.localUri)
  return file.text()
}

export default function PrivacyScreen() {
  const { isDark } = useThemeContext()
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadContent = useCallback(async () => {
    try {
      const content = await loadMarkdownAsset(PRIVACY_MD)
      setMarkdown(content)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load privacy policy')
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const blocks = useMemo(() => (markdown ? parseMarkdown(markdown) : []), [markdown])

  const bg = isDark ? '#0c0a09' : '#fafaf9'
  const muted = isDark ? '#a8a29e' : '#78716c'

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, padding: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: muted, textAlign: 'center' }}>{error}</Text>
      </View>
    )
  }

  if (!markdown) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={muted} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} isDark={isDark} />
      ))}
    </ScrollView>
  )
}
