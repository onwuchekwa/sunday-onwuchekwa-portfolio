import { normalizeInstitutionEntry, normalizeResearchInterestEntry } from '@/utils/cvFormat'

export type CvSectionId =
  | 'researchInterests'
  | 'education'
  | 'appointments'
  | 'industryExperience'
  | 'volunteerExperience'
  | 'awards'
  | 'service'
  | 'invitedEvents'
  | 'presentations'
  | 'grants'
  | 'certificates'
  | 'skills'

export interface CvSection {
  id: CvSectionId | 'publications'
  title: string
  visible: boolean
  order: number
  entries: Record<string, unknown>[]
}

export interface CvDocument {
  sections: CvSection[]
  lastUpdated: string
  publicationsIntro?: string
}

export interface CvSectionMeta {
  id: CvSectionId
  title: string
  fields: { key: string; label: string; type: 'text' | 'textarea' | 'tags' }[]
}

/** Per-entry flag: hidden from public CV when false. Defaults to true when missing. */
export function isEntryVisible(entry: Record<string, unknown>): boolean {
  return entry.visible !== false
}

/** Per-entry flag: hidden from About page education when false. Defaults to true when missing. */
export function isAboutEntryVisible(entry: Record<string, unknown>): boolean {
  return entry.showOnAbout !== false
}

function normalizeEducationEntry(entry: Record<string, unknown>): Record<string, unknown> {
  return { ...normalizeInstitutionEntry(entry), showOnAbout: isAboutEntryVisible(entry) }
}

const LEGACY_SECTION_TITLES: Partial<Record<CvSectionId, string[]>> = {
  appointments: ['Experience'],
  service: ['Organizing and Service'],
}

function resolveSectionTitle(section: CvSection, meta?: CvSectionMeta): string {
  const stored = section.title?.trim()
  const legacy = LEGACY_SECTION_TITLES[section.id as CvSectionId]
  if (stored && legacy?.includes(stored) && meta?.title) {
    return meta.title
  }
  return stored || meta?.title || section.title
}

export function normalizeCvEntry(entry: Record<string, unknown>): Record<string, unknown> {
  return { ...entry, visible: isEntryVisible(entry) }
}

export const CV_SECTION_META: CvSectionMeta[] = [
  {
    id: 'researchInterests',
    title: 'Research Interests',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description (home page Research Focus cards)', type: 'textarea' },
      { key: 'icon', label: 'Icon (e.g. mdi-church)', type: 'text' },
    ],
  },
  {
    id: 'education',
    title: 'Education',
    fields: [
      { key: 'degree', label: 'Degree', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'year', label: 'End date', type: 'text' },
      { key: 'details', label: 'Details (one bullet per line)', type: 'textarea' },
    ],
  },
  {
    id: 'appointments',
    title: 'Academic Experience',
    fields: [
      { key: 'role', label: 'Role (RA, TA, instructor, etc.)', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
      { key: 'details', label: 'Details (one bullet per line)', type: 'textarea' },
    ],
  },
  {
    id: 'industryExperience',
    title: 'Industry Experience',
    fields: [
      { key: 'role', label: 'Job title', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
      { key: 'details', label: 'Responsibilities (one bullet per line)', type: 'textarea' },
    ],
  },
  {
    id: 'volunteerExperience',
    title: 'Volunteer Experience',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Organization', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
      { key: 'details', label: 'Responsibilities (one bullet per line)', type: 'textarea' },
    ],
  },
  {
    id: 'awards',
    title: 'Honors, Awards, and Fellowships',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'year', label: 'Year', type: 'text' },
    ],
  },
  {
    id: 'service',
    title: 'Academic Service',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'organization', label: 'Organization / Venue', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
    ],
  },
  {
    id: 'invitedEvents',
    title: 'Invited Events',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'venue', label: 'Venue / Host', type: 'text' },
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'details', label: 'Details', type: 'textarea' },
    ],
  },
  {
    id: 'presentations',
    title: 'Presentations & Talks',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'venue', label: 'Venue', type: 'text' },
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
    ],
  },
  {
    id: 'grants',
    title: 'Grants & Funding',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'funder', label: 'Funder', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
    ],
  },
  {
    id: 'certificates',
    title: 'Certificates',
    fields: [{ key: 'name', label: 'Certificate name', type: 'text' }],
  },
  {
    id: 'skills',
    title: 'Skills',
    fields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'items', label: 'Items (comma-separated)', type: 'text' },
    ],
  },
]

const DEFAULT_VISIBLE_SECTIONS: CvSectionId[] = [
  'researchInterests',
  'education',
  'appointments',
  'awards',
  'service',
]

export function createDefaultCvSections(): CvSection[] {
  return CV_SECTION_META.map((meta, index) => ({
    id: meta.id,
    title: meta.title,
    visible: DEFAULT_VISIBLE_SECTIONS.includes(meta.id),
    order: index,
    entries: [],
  }))
}

export function createDefaultCvDocument(): CvDocument {
  return {
    sections: createDefaultCvSections(),
    lastUpdated: new Date().toISOString(),
    publicationsIntro: '',
  }
}

export function entryToFormValues(
  sectionId: CvSectionId,
  entry: Record<string, unknown>,
  meta: CvSectionMeta,
): Record<string, string> {
  const form: Record<string, string> = {}
  for (const field of meta.fields) {
    let value: unknown = entry[field.key]
    if (sectionId === 'researchInterests' && field.key === 'title') {
      value = entry.title ?? entry.text
    }
    form[field.key] = String(value ?? '')
  }
  return form
}

export function normalizeCvDocument(data: CvDocument): CvDocument {
  const metaIds = new Set(CV_SECTION_META.map((m) => m.id))
  const existingIds = new Set(data.sections.map((s) => s.id))

  const sections = data.sections.map((section) => {
    const meta = CV_SECTION_META.find((m) => m.id === section.id)
    return {
      ...section,
      title: resolveSectionTitle(section, meta),
      entries: section.entries.map((e) => {
        const normalized = normalizeCvEntry(e)
        if (section.id === 'education') {
          return normalizeEducationEntry(normalized)
        }
        if (section.id === 'appointments') {
          return normalizeInstitutionEntry(normalized)
        }
        if (section.id === 'researchInterests') {
          return normalizeResearchInterestEntry(normalized)
        }
        return normalized
      }),
    }
  })

  for (const meta of CV_SECTION_META) {
    if (!existingIds.has(meta.id)) {
      sections.push({
        id: meta.id,
        title: meta.title,
        visible: false,
        order: sections.length,
        entries: [],
      })
    }
  }

  const metaOrder = new Map(CV_SECTION_META.map((m, i) => [m.id, i]))

  return {
    ...data,
    publicationsIntro: data.publicationsIntro ?? '',
    sections: sections
      .filter((s) => s.id === 'publications' || metaIds.has(s.id as CvSectionId))
      .sort((a, b) => {
        const orderA = metaOrder.get(a.id as CvSectionId) ?? a.order
        const orderB = metaOrder.get(b.id as CvSectionId) ?? b.order
        return orderA - orderB
      })
      .map((s, index) => ({ ...s, order: index })),
  }
}
