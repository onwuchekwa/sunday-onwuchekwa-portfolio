export type CvSectionId =
  | 'education'
  | 'researchInterests'
  | 'appointments'
  | 'presentations'
  | 'grants'
  | 'teaching'
  | 'service'
  | 'awards'
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
}

export interface CvSectionMeta {
  id: CvSectionId
  title: string
  fields: { key: string; label: string; type: 'text' | 'textarea' | 'tags' }[]
}

export const CV_SECTION_META: CvSectionMeta[] = [
  {
    id: 'education',
    title: 'Education',
    fields: [
      { key: 'degree', label: 'Degree', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'year', label: 'Year / Dates', type: 'text' },
      { key: 'details', label: 'Details', type: 'textarea' },
    ],
  },
  {
    id: 'researchInterests',
    title: 'Research Interests',
    fields: [{ key: 'text', label: 'Interest', type: 'text' }],
  },
  {
    id: 'appointments',
    title: 'Academic Appointments',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
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
    id: 'teaching',
    title: 'Teaching',
    fields: [
      { key: 'course', label: 'Course', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'term', label: 'Term', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
    ],
  },
  {
    id: 'service',
    title: 'Academic Service',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'organization', label: 'Organization', type: 'text' },
      { key: 'dates', label: 'Dates', type: 'text' },
    ],
  },
  {
    id: 'awards',
    title: 'Awards & Honors',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'year', label: 'Year', type: 'text' },
    ],
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

export function createDefaultCvSections(): CvSection[] {
  return CV_SECTION_META.map((meta, index) => ({
    id: meta.id,
    title: meta.title,
    visible: ['education', 'researchInterests', 'appointments', 'skills'].includes(meta.id),
    order: index,
    entries: [],
  }))
}

export function createDefaultCvDocument(): CvDocument {
  return {
    sections: createDefaultCvSections(),
    lastUpdated: new Date().toISOString(),
  }
}
