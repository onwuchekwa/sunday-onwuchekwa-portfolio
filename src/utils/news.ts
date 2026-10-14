/** Blank lines separate paragraphs in a news body. */
export function newsParagraphs(body: string): string[] {
  return (body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** First sentence of the post (up to ~200 characters) for the news list. */
export function newsSummary(body: string, maxLength = 200): string {
  const first = newsParagraphs(body)[0]?.replace(/\s+/g, ' ') ?? ''
  const sentence = first.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? first
  if (sentence.length <= maxLength) return sentence
  return `${sentence.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
}

export interface TextSegment {
  text: string
  href?: string
}

/** Split text so bare URLs can render as links (trailing punctuation stays as text). */
export function linkifySegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const pattern = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)'\]]/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ text: text.slice(last, start) })
    segments.push({ text: match[0], href: match[0] })
    last = start + match[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}
