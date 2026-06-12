import type { Publication } from '@/types/content'
import {
  PUBLICATION_CV_CATEGORIES,
  resolvePublicationCvCategory,
  type PublicationCvCategory,
} from '@/types/content'

const JOURNAL_MODEL_MARKER = 'ᐩ'

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
  return {
    institution,
    location,
    degree: String(entry.degree ?? '').trim(),
    year: String(entry.year ?? '').trim(),
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
    dates: String(entry.dates ?? '').trim(),
    location,
    details: entry.details,
  }
}

export function normalizeInstitutionEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const { institution, location } = splitInstitutionAndLocation(entry.institution, entry.location)
  return { ...entry, institution, location }
}

export function formatResearchInterests(entries: Record<string, unknown>[]): string {
  return entries
    .map((e) => String(e.text ?? '').trim())
    .filter(Boolean)
    .join(', ')
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
    case 'teaching':
      return [entry.role, entry.course, entry.institution, entry.term].filter(Boolean).join(' · ')
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
