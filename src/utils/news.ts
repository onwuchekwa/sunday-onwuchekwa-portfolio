/**
 * News bodies use a small Markdown subset, parsed into plain data (never raw HTML):
 *   ## Subheading / ### Smaller subheading
 *   - bullet item
 *   [link text](https://example.com), **bold**, *italic*, and bare https:// URLs
 * Blank lines separate paragraphs; single line breaks are kept.
 */

export interface InlineSegment {
  text: string
  href?: string
  bold?: boolean
  italic?: boolean
}

export type NewsBlock =
  | { kind: 'heading'; level: 2 | 3; segments: InlineSegment[] }
  | { kind: 'paragraph'; segments: InlineSegment[] }
  | { kind: 'list'; items: InlineSegment[][] }

const HEADING = /^(#{2,3})\s+(.+)$/
const BULLET = /^[-*]\s+(.+)$/

export function parseNewsBody(body: string): NewsBlock[] {
  const blocks: NewsBlock[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', segments: parseInline(paragraph.join('\n')) })
    paragraph = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ kind: 'list', items: list.map(parseInline) })
    list = []
  }

  for (const raw of (body ?? '').split(/\r?\n/)) {
    const line = raw.trim()
    const heading = line.match(HEADING)
    const bullet = line.match(BULLET)
    if (!line) {
      flushParagraph()
      flushList()
    } else if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'heading', level: heading[1].length as 2 | 3, segments: parseInline(heading[2]) })
    } else if (bullet) {
      flushParagraph()
      list.push(bullet[1])
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

/** [text](url) | **bold** | *italic* or _italic_ | bare URL */
const INLINE =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])[*_](?![\s*_])(.+?)(?<![\s*_])[*_](?![\w*])|(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)'\]])/g

export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ text: text.slice(last, start) })
    const [whole, linkText, linkUrl, bold, italic, bareUrl] = match
    if (linkText !== undefined) {
      const href = safeHref(linkUrl)
      segments.push(href ? { text: linkText, href } : { text: whole })
    } else if (bold !== undefined) {
      segments.push({ text: bold, bold: true })
    } else if (italic !== undefined) {
      segments.push({ text: italic, italic: true })
    } else if (bareUrl !== undefined) {
      segments.push({ text: bareUrl, href: bareUrl })
    }
    last = start + whole.length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}

/** Only web, mail, and on-site links are allowed (no javascript: and the like). */
function safeHref(url: string): string | null {
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url
  if (url.startsWith('/') && !url.startsWith('//')) return url
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(url)) return `https://${url}`
  return null
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/** First sentence of the first paragraph (formatting removed, ~200 chars) for the news list. */
export function newsSummary(body: string, maxLength = 200): string {
  const first = parseNewsBody(body).find((block) => block.kind === 'paragraph')
  const text = first && first.kind === 'paragraph' ? first.segments.map((s) => s.text).join('') : ''
  const flat = text.replace(/\s+/g, ' ').trim()
  const sentence = flat.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? flat
  if (sentence.length <= maxLength) return sentence
  return `${sentence.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
}
