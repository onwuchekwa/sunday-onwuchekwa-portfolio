import type { Publication } from '@/types/content'
import {
  PUBLICATION_CV_CATEGORIES,
  resolvePublicationCvCategory,
  type PublicationCvCategory,
} from '@/types/content'
import { isAboutEntryVisible } from '@/types/cv'

const JOURNAL_MODEL_MARKER = 'ᐩ'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const MONTH_ALIASES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

export interface ParsedDateRange {
  start: number
  end: number
  isCurrent: boolean
  startLabel: string
  endLabel: string
}

export interface ParsedMonthYear {
  sortKey: number
  label: string
}

function currentSortKey(): number {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

function resolveMonthNumber(monthPart: string): number {
  const normalized = monthPart.replace(/\./g, '').trim().toLowerCase()
  if (!normalized) return 1

  if (MONTH_ALIASES[normalized]) return MONTH_ALIASES[normalized]

  const short = normalized.slice(0, 3)
  for (const [alias, month] of Object.entries(MONTH_ALIASES)) {
    if (alias.startsWith(short) || short === alias.slice(0, 3)) {
      return month
    }
  }

  return 1
}

export function parseMonthYearToken(token: string): ParsedMonthYear {
  const cleaned = token.trim()
  if (!cleaned) {
    return { sortKey: 0, label: '' }
  }

  if (/^present$/i.test(cleaned.replace(/\./g, ''))) {
    return { sortKey: currentSortKey(), label: '' }
  }

  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/)
  if (!yearMatch) {
    return { sortKey: 0, label: cleaned }
  }

  const year = Number(yearMatch[0])
  const monthPart = cleaned.replace(yearMatch[0], '').trim()
  const month = resolveMonthNumber(monthPart)
  return {
    sortKey: year * 100 + month,
    label: `${MONTH_LABELS[month - 1]} ${year}`,
  }
}

function splitDateRange(value: string): { startToken: string; endToken: string; isCurrent: boolean } {
  const trimmed = value.trim()
  if (!trimmed) {
    return { startToken: '', endToken: '', isCurrent: false }
  }

  const parts = trimmed.split(/\s*[–-]\s*|\s+to\s+/i).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const endToken = parts[parts.length - 1]
    const isCurrent = /present/i.test(endToken)
    return { startToken: parts[0], endToken, isCurrent }
  }

  const isCurrent = /present/i.test(trimmed)
  return { startToken: trimmed, endToken: trimmed, isCurrent }
}

export function parseExperienceDateRange(dates: string): ParsedDateRange {
  const { startToken, endToken, isCurrent } = splitDateRange(dates)
  const start = parseMonthYearToken(startToken)
  const end = isCurrent ? { sortKey: currentSortKey(), label: '' } : parseMonthYearToken(endToken)

  return {
    start: start.sortKey,
    end: isCurrent ? currentSortKey() : end.sortKey,
    isCurrent,
    startLabel: start.label,
    endLabel: end.label,
  }
}

function parseEducationDateRange(year: string): ParsedDateRange {
  return parseExperienceDateRange(year)
}

export function parseEducationEndDate(year: string): number {
  const range = parseEducationDateRange(year)
  const { endToken, startToken } = splitDateRange(year)

  if (/present/i.test(year)) {
    if (/present/i.test(endToken)) {
      const start = parseMonthYearToken(startToken)
      const hasMonth = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(startToken)
      if (hasMonth && start.sortKey) return start.sortKey
      return currentSortKey()
    }
    const anticipated = parseMonthYearToken(endToken)
    return anticipated.sortKey || currentSortKey()
  }

  return range.end || range.start
}

export function formatExperienceDates(dates: string): string {
  const raw = dates.trim()
  if (!raw) return ''

  const { startToken, endToken, isCurrent } = splitDateRange(raw)
  const start = parseMonthYearToken(startToken)

  if (isCurrent) {
    return start.label ? `${start.label} – Present` : 'Present'
  }

  const end = parseMonthYearToken(endToken)
  if (start.label && end.label) return `${start.label} – ${end.label}`
  return start.label || end.label || raw
}

function isEducationInProgress(year: string): boolean {
  if (/present/i.test(year)) return true
  return parseEducationEndDate(year) >= currentSortKey()
}

export function formatEducationYear(year: string): string {
  const raw = year.trim()
  if (!raw) return ''

  const { endToken } = splitDateRange(raw)
  const end = parseMonthYearToken(endToken)

  if (isEducationInProgress(raw)) {
    const label =
      end.label ||
      parseMonthYearToken(raw.replace(/present/gi, '').trim()).label ||
      `${MONTH_LABELS[new Date().getMonth()]} ${new Date().getFullYear()}`
    return `Anticipated: ${label}`
  }

  return end.label || raw
}

export function sortExperienceEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...entries].sort((a, b) => {
    const left = parseExperienceDateRange(String(a.dates ?? ''))
    const right = parseExperienceDateRange(String(b.dates ?? ''))
    if (left.isCurrent !== right.isCurrent) {
      return left.isCurrent ? -1 : 1
    }
    return right.start - left.start
  })
}

export function sortEducationEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...entries].sort(
    (a, b) => parseEducationEndDate(String(b.year ?? '')) - parseEducationEndDate(String(a.year ?? '')),
  )
}

export function splitDetailLines(details: unknown): string[] {
  if (!details) return []
  return String(details)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Split trailing "City, ST" from combined institution strings for display-only fallback. */
export function splitInstitutionAndLocation(
  institution: unknown,
  location?: unknown,
): { institution: string; location: string } {
  const storedInstitution = String(institution ?? '').trim()
  const storedLocation = String(location ?? '').trim()
  if (storedLocation) {
    return { institution: storedInstitution, location: storedLocation }
  }

  const match = storedInstitution.match(/^(.+?),\s*([^,]+,\s*[A-Z]{2}(?:\s+[A-Z]{2,3})?)$/)
  if (match) {
    return { institution: match[1].trim(), location: match[2].trim() }
  }

  const looseMatch = storedInstitution.match(/^(.+?),\s*(.+)$/)
  if (looseMatch && looseMatch[2].includes(',')) {
    return { institution: looseMatch[1].trim(), location: looseMatch[2].trim() }
  }

  return { institution: storedInstitution, location: '' }
}

export function resolveEducationDisplay(entry: Record<string, unknown>) {
  const { institution, location } = splitInstitutionAndLocation(entry.institution, entry.location)
  const rawYear = String(entry.year ?? '').trim()
  return {
    institution,
    location,
    degree: String(entry.degree ?? '').trim(),
    year: formatEducationYear(rawYear),
    details: entry.details,
  }
}

export function resolveExperienceDisplay(
  entry: Record<string, unknown>,
  options?: { educationEntries?: Record<string, unknown>[] },
) {
  let { institution, location } = splitInstitutionAndLocation(entry.institution, entry.location)

  if (!location && options?.educationEntries?.length) {
    const match = options.educationEntries.find((edu) => {
      const eduInst = splitInstitutionAndLocation(edu.institution, edu.location).institution
      return eduInst && eduInst === institution
    })
    if (match) {
      location = splitInstitutionAndLocation(match.institution, match.location).location
    }
  }

  return {
    primary: String(entry.role ?? '').trim(),
    secondary: institution,
    dates: formatExperienceDates(String(entry.dates ?? '')),
    location,
    details: entry.details,
  }
}

export function normalizeInstitutionEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const { institution, location } = splitInstitutionAndLocation(entry.institution, entry.location)
  return { ...entry, institution, location }
}

export function normalizeResearchInterestEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const title = resolveResearchInterestTitle(entry)
  const { text: _legacyText, ...rest } = entry
  return title ? { ...rest, title } : { ...rest }
}

export function resolveResearchInterestTitle(entry: Record<string, unknown>): string {
  return String(entry.title ?? entry.text ?? '').trim()
}

export interface ResearchInterestDisplay {
  title: string
  description: string
  icon: string
}

const DEFAULT_RESEARCH_ICON = 'mdi-lightbulb-outline'

export function toResearchInterestDisplay(entry: Record<string, unknown>): ResearchInterestDisplay {
  const icon = String(entry.icon ?? '').trim()
  return {
    title: resolveResearchInterestTitle(entry),
    description: String(entry.description ?? '').trim(),
    icon: icon || DEFAULT_RESEARCH_ICON,
  }
}

export function formatResearchInterests(entries: Record<string, unknown>[]): string {
  return entries
    .map((e) => resolveResearchInterestTitle(e))
    .filter(Boolean)
    .join(', ')
}

export function formatCertificates(entries: Record<string, unknown>[]): string {
  return entries
    .map((e) => String(e.name ?? '').trim())
    .filter(Boolean)
    .join(' | ')
}

export function selectAboutEducationEntries(
  entries: Record<string, unknown>[],
  max = 4,
): Record<string, unknown>[] {
  return [...entries]
    .filter(isAboutEntryVisible)
    .sort(
      (a, b) =>
        parseEducationEndDate(String(b.year ?? '')) - parseEducationEndDate(String(a.year ?? '')),
    )
    .slice(0, max)
}

export function formatAwardEntry(entry: Record<string, unknown>): string {
  const parts = [entry.title, entry.issuer, entry.year].filter(Boolean)
  if (parts.length >= 2) {
    return `${entry.title} (${entry.year}), ${entry.issuer}`
  }
  return parts.join(', ')
}

export function formatServiceEntry(entry: Record<string, unknown>): string {
  const role = [entry.role, entry.dates].filter(Boolean).join(' ')
  const org = String(entry.organization ?? '').trim()
  return org ? `${role}, ${org}` : role
}

export function formatInvitedEvent(entry: Record<string, unknown>): string {
  const title = String(entry.title ?? '').trim()
  const venue = String(entry.venue ?? '').trim()
  const date = String(entry.date ?? '').trim()
  const details = String(entry.details ?? '').trim()
  const head = [title, venue ? `(${venue})` : '', date ? `(${date})` : ''].filter(Boolean).join(' ')
  return details ? `${head} ${details}` : head
}

export function formatSimpleEntry(entry: Record<string, unknown>, sectionId: string): string {
  switch (sectionId) {
    case 'awards':
      return formatAwardEntry(entry)
    case 'service':
      return formatServiceEntry(entry)
    case 'invitedEvents':
      return formatInvitedEvent(entry)
    case 'presentations':
      return [entry.title, entry.venue, entry.date].filter(Boolean).join(' · ')
    case 'grants':
      return [entry.title, entry.funder, entry.dates].filter(Boolean).join(' · ')
    case 'skills': {
      const items = String(entry.items ?? '')
      return `${entry.category}: ${items}`
    }
    default:
      return Object.entries(entry)
        .filter(([key]) => key !== 'visible')
        .map(([, value]) => value)
        .filter(Boolean)
        .join(' · ')
  }
}

export function formatPublicationCitation(pub: Publication): string {
  const category = resolvePublicationCvCategory(pub)
  const journalMarker =
    pub.isJournalModel || category === 'journal_article' ? ` ${JOURNAL_MODEL_MARKER}` : ''
  const title = `"${pub.title}."`
  const venue = pub.venue ? `${pub.venue}${journalMarker}` : ''
  const yearPart = pub.year ? String(pub.year) : ''
  const tail = [pub.cvStatus, pub.acceptanceRate, pub.scholarNote].filter(Boolean).join(', ')
  const base = [pub.authors, title, venue, yearPart].filter(Boolean).join(' ')
  return tail ? `${base} (${tail})` : base
}

export interface PublicationCategoryGroup {
  category: PublicationCvCategory
  title: string
  order: number
  publications: Publication[]
}

export function groupPublicationsByCategory(publications: Publication[]): PublicationCategoryGroup[] {
  const sorted = [...publications].sort((a, b) => {
    if (a.cvOrder !== b.cvOrder) return a.cvOrder - b.cvOrder
    return b.year - a.year
  })

  const grouped = new Map<PublicationCvCategory, Publication[]>()
  for (const pub of sorted) {
    const category = resolvePublicationCvCategory(pub)
    const list = grouped.get(category) ?? []
    list.push(pub)
    grouped.set(category, list)
  }

  return PUBLICATION_CV_CATEGORIES.filter((meta) => grouped.has(meta.value)).map((meta) => ({
    category: meta.value,
    title: meta.title,
    order: meta.order,
    publications: grouped.get(meta.value) ?? [],
  }))
}

export const CV_PUBLICATION_FOOTNOTES = {
  journalModel:
    'Recently, several top conferences have transitioned to a journal model and do not yet have an impact factor — below these are indicated by ᐩ and include the corresponding conference name and google scholar ranking at time of publication.',
  workshop:
    'CHI is a tier 1 conference — workshop acceptance is considered selective, thus acceptance rates included where available.',
}
