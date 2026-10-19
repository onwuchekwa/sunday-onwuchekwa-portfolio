import type { Publication, PublicationAuthor } from '@/types/content'
import {
  publicationTypeLabel,
  resolvePublicationStatus,
  resolveVenueShort,
  type PublicationType,
} from '@/types/content'


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
    return `Expected ${label}`
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

/** URL-friendly form of a title: "Faith & Technology" → "faith-and-technology". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Research interests double as publication tags. Each keeps a stable `id` (first taken from
 * its title) so renaming a theme later doesn't untag its papers.
 */
export function normalizeResearchInterestEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const title = resolveResearchInterestTitle(entry)
  const { text: _legacyText, ...rest } = entry
  const id = String(rest.id ?? '').trim() || slugify(title)
  return title ? { ...rest, title, ...(id ? { id } : {}) } : { ...rest }
}

export function resolveResearchInterestTitle(entry: Record<string, unknown>): string {
  return String(entry.title ?? entry.text ?? '').trim()
}

export interface ResearchInterestDisplay {
  /** Stable; what publications store in `themes`. */
  id: string
  /** From the current title; used in /research/<slug>. */
  slug: string
  title: string
  description: string
}

export function toResearchInterestDisplay(entry: Record<string, unknown>): ResearchInterestDisplay {
  const title = resolveResearchInterestTitle(entry)
  return {
    id: String(entry.id ?? '').trim() || slugify(title),
    slug: slugify(title),
    title,
    description: String(entry.description ?? '').trim(),
  }
}

export function formatCertificates(entries: Record<string, unknown>[]): string {
  return entries
    .map((e) => String(e.name ?? '').trim())
    .filter(Boolean)
    .join(' | ')
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
  const orgVenue = [entry.organization, entry.venue]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ')
  return orgVenue ? `${role}, ${orgVenue}` : role
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

const OWNER_AUTHOR_PATTERN = /^Sunday\s+(?:O\.?\s+)?Onwuchekwa$/i

export interface AuthorSegment {
  text: string
  bold: boolean
}

function splitLegacyAuthors(value: string): string[] {
  return value
    .split(/\s*,\s*(?:and\s+|&\s*)?|\s+(?:and|&)\s+/i)
    .map((name) => name.trim())
    .filter(Boolean)
}

export function normalizeAuthors(value: unknown): PublicationAuthor[] {
  if (Array.isArray(value)) {
    return value
      .map((author) => {
        if (typeof author === 'string') {
          const name = author.trim()
          return { name, bold: OWNER_AUTHOR_PATTERN.test(name) }
        }
        const record = (author ?? {}) as Record<string, unknown>
        return { name: String(record.name ?? '').trim(), bold: record.bold === true }
      })
      .filter((author) => author.name)
  }

  if (typeof value === 'string') {
    return splitLegacyAuthors(value).map((name) => ({ name, bold: OWNER_AUTHOR_PATTERN.test(name) }))
  }

  return []
}

export function formatAuthorSegments(authors: PublicationAuthor[]): AuthorSegment[] {
  const named = authors.filter((author) => author.name.trim())
  const segments: AuthorSegment[] = []

  named.forEach((author, index) => {
    if (index > 0) {
      const isLast = index === named.length - 1
      const separator = !isLast ? ', ' : named.length === 2 ? ' and ' : ', and '
      segments.push({ text: separator, bold: false })
    }
    segments.push({ text: author.name.trim(), bold: author.bold })
  })

  return segments
}

export function formatAuthorNames(authors: PublicationAuthor[]): string {
  return formatAuthorSegments(authors)
    .map((segment) => segment.text)
    .join('')
}

export interface CvCitation {
  /** "(2026)." or "(TBA)." */
  year: string
  title: string
  link: string
  /** Venue with its short name, e.g. "In Companion of … (CSCW Companion '26)" */
  venue: string
  /** Status / acceptance notes, e.g. "Accepted, 43.98% acceptance rate" */
  notes: string
}

function straightQuotes(text: string): string {
  return text.replace(/[‘’]/g, "'")
}

/** Citation pieces in the classic CS CV order: Authors (Year). Title. Venue (Short). */
export function formatCvCitation(pub: Publication): CvCitation {
  const underReview = resolvePublicationStatus(pub) === 'under_review'
  const short = resolveVenueShort(pub)
  const venue = underReview
    ? `(${publicationTypeLabel(pub.type)})`
    : [pub.venue, short && !straightQuotes(pub.venue).includes(straightQuotes(short)) ? `(${short})` : '']
        .filter(Boolean)
        .join(' ')
  return {
    year: underReview ? '(TBA).' : pub.year ? `(${pub.year}).` : '',
    title: pub.title.trim().replace(/\.$/, ''),
    link: pub.sourceUrl || pub.links?.doi || pub.links?.pdf || pub.links?.arxiv || '',
    venue,
    notes: [pub.cvStatus, pub.acceptanceRate, pub.scholarNote].filter(Boolean).join(', '),
  }
}

/** CV publication groups (classic CS CV): code letter, bracketed heading, the types it holds. */
const CV_PUBLICATION_GROUPS: { id: string; code: string; legend: string; title: string; types: PublicationType[] }[] = [
  { id: 'conference', code: 'C', legend: 'Conference', title: 'Peer-reviewed Conference Proceedings', types: ['full_paper', 'short_paper'] },
  { id: 'journal', code: 'J', legend: 'Journal', title: 'Journal Publications', types: ['journal', 'book_chapter'] },
  {
    id: 'short',
    code: 'S',
    legend: 'Short Paper and Poster',
    title: 'Late-Breaking Work, Posters and Demos',
    types: ['late_breaking_work', 'extended_abstract', 'poster', 'demo', 'doctoral_consortium'],
  },
  { id: 'workshop', code: 'W', legend: 'Workshop', title: 'Workshop Papers', types: ['workshop_paper'] },
  { id: 'other', code: 'T', legend: 'Thesis', title: 'Theses and Other', types: ['thesis', 'other'] },
]

export interface PublicationCategoryGroup {
  id: string
  /** Entry prefix, e.g. "C" → [C.1] */
  code: string
  /** Legend label, e.g. "Conference" for "C=Conference" */
  legend: string
  title: string
  publications: Publication[]
}

/** CV publication groups by type, under-review work last; each numbered with its own code. */
export function groupPublicationsByCategory(publications: Publication[]): PublicationCategoryGroup[] {
  const sorted = [...publications].sort((a, b) => {
    if (a.cvOrder !== b.cvOrder) return a.cvOrder - b.cvOrder
    return b.year - a.year
  })

  // US committees expect submitted work apart from refereed publications.
  const underReview = sorted.filter((pub) => resolvePublicationStatus(pub) === 'under_review')
  const refereed = sorted.filter((pub) => !underReview.includes(pub))

  const groups: PublicationCategoryGroup[] = CV_PUBLICATION_GROUPS.map(({ types, ...group }) => ({
    ...group,
    publications: refereed.filter((pub) => types.includes(pub.type)),
  })).filter((group) => group.publications.length)

  if (underReview.length) {
    groups.push({ id: 'under_review', code: 'U', legend: 'Under Review', title: 'Under Review', publications: underReview })
  }
  return groups
}

