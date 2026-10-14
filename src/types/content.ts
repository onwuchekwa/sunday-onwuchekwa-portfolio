export interface SocialLink {
  platform: string
  url: string
  icon?: string
}

/** Public pages that can be toggled on/off from Admin → Settings. */
export type PublicPageId = 'publications' | 'news' | 'cv'

export type PageVisibility = Record<PublicPageId, boolean>

export const PUBLIC_PAGES: { id: PublicPageId; title: string }[] = [
  { id: 'publications', title: 'Publications' },
  { id: 'news', title: 'News' },
  { id: 'cv', title: 'CV' },
]

export const defaultPageVisibility = (): PageVisibility => ({
  publications: true,
  news: true,
  cv: true,
})

export interface SiteSettings {
  name: string
  title: string
  tagline: string
  email: string
  phone: string
  /** Personal website URL shown on CV header and contact areas */
  websiteUrl: string
  /** Short affiliation for the sidebar, e.g. "Brigham Young University" */
  affiliation: string
  /** e.g. "Provo, Utah" */
  location: string
  /** Optional highlighted callout on the home page (e.g. internship search) */
  announcement: string
  /** Optional "Beyond Research" paragraph on the home page */
  beyondResearch: string
  socialLinks: SocialLink[]
  /** Base64 data URL (compressed) or external image URL */
  profileImageUrl: string
  /** Which public pages appear in the menu and are reachable */
  pageVisibility: PageVisibility
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
  details?: string
}

export interface About {
  bio: string
  researchInterests: string[]
  education: EducationEntry[]
}

/** Publication types as used by CS/HCI venues (ACM, IEEE, USENIX, …). */
export type PublicationType =
  | 'full_paper'
  | 'journal'
  | 'short_paper'
  | 'late_breaking_work'
  | 'extended_abstract'
  | 'poster'
  | 'demo'
  | 'doctoral_consortium'
  | 'workshop_paper'
  | 'book_chapter'
  | 'thesis'
  | 'other'

export const PUBLICATION_TYPES: { value: PublicationType; title: string; hint: string }[] = [
  { value: 'full_paper', title: 'Full Paper', hint: 'Archival full paper in conference proceedings (CHI, DIS, IUI, …)' },
  { value: 'journal', title: 'Journal', hint: 'Journal article, incl. journal-model venues (PACM HCI / CSCW, TOCHI)' },
  { value: 'short_paper', title: 'Short Paper', hint: 'Archival short or note paper' },
  { value: 'late_breaking_work', title: 'Late-Breaking Work', hint: 'CHI LBW and similar extended-abstract tracks' },
  { value: 'extended_abstract', title: 'Extended Abstract', hint: 'Companion / adjunct extended abstract' },
  { value: 'poster', title: 'Poster', hint: 'Poster with an accompanying abstract' },
  { value: 'demo', title: 'Demo', hint: 'Interactivity, demo, or technology demonstration' },
  { value: 'doctoral_consortium', title: 'Doctoral Consortium', hint: 'Doctoral consortium paper' },
  { value: 'workshop_paper', title: 'Workshop Paper', hint: 'Workshop or position paper' },
  { value: 'book_chapter', title: 'Book Chapter', hint: 'Chapter in an edited volume' },
  { value: 'thesis', title: 'Thesis', hint: 'Master’s or doctoral thesis' },
  { value: 'other', title: 'Other', hint: 'Anything else (preprint, report, …)' },
]

export function publicationTypeLabel(type: PublicationType): string {
  return PUBLICATION_TYPES.find((t) => t.value === type)?.title ?? 'Other'
}

export type PublicationStatus = 'published' | 'accepted' | 'under_review'

export const PUBLICATION_STATUSES: { value: PublicationStatus; title: string }[] = [
  { value: 'published', title: 'Published' },
  { value: 'accepted', title: 'Accepted / Forthcoming' },
  { value: 'under_review', title: 'Under Review' },
]

/** Buckets for the "By Type" view on the Publications page. */
export const PUBLICATION_TYPE_GROUPS: { id: string; title: string; types: PublicationType[] }[] = [
  { id: 'journal', title: 'Journal Articles & Book Chapters', types: ['journal', 'book_chapter'] },
  { id: 'conference', title: 'Peer-Reviewed Conference Papers', types: ['full_paper', 'short_paper'] },
  {
    id: 'short',
    title: 'Late-Breaking Work, Posters & Demos',
    types: ['late_breaking_work', 'extended_abstract', 'poster', 'demo', 'doctoral_consortium'],
  },
  { id: 'workshop', title: 'Workshop Papers', types: ['workshop_paper'] },
  { id: 'other', title: 'Theses & Other', types: ['thesis', 'other'] },
]

/** CV categories stored by older records; only read to infer their type. */
export type PublicationCvCategory =
  | 'journal_article'
  | 'conference_proceedings'
  | 'technology_demonstration'
  | 'workshop_extended_abstract'
  | 'poster_extended_abstract'
  | 'archived_abstract'

/** Stored on records saved with the CS type list, so legacy records can be told apart. */
export const PUBLICATION_TYPE_SCHEME = 'cs' as const

const CV_CATEGORY_TO_TYPE: Record<PublicationCvCategory, PublicationType> = {
  journal_article: 'journal',
  conference_proceedings: 'full_paper',
  technology_demonstration: 'demo',
  workshop_extended_abstract: 'workshop_paper',
  poster_extended_abstract: 'poster',
  archived_abstract: 'extended_abstract',
}

/**
 * Resolve a stored type to a CS publication type. Records saved before the CS type list
 * (no `typeScheme`) used paper/poster/workshop/other; their cvCategory is more specific, so it decides.
 */
export function normalizePublicationType(
  type: unknown,
  cvCategory?: PublicationCvCategory | '',
  typeScheme?: string,
): PublicationType {
  const isKnown = PUBLICATION_TYPES.some((t) => t.value === type)
  if (isKnown && typeScheme === PUBLICATION_TYPE_SCHEME) return type as PublicationType
  if (cvCategory && CV_CATEGORY_TO_TYPE[cvCategory]) return CV_CATEGORY_TO_TYPE[cvCategory]
  if (isKnown) return type as PublicationType
  if (type === 'workshop') return 'workshop_paper'
  if (type === 'poster' || type === 'other') return type
  return 'full_paper'
}

/** Infer status from the free-text CV status when no explicit status is stored. */
export function resolvePublicationStatus(
  pub: Pick<Publication, 'status' | 'cvStatus'>,
): PublicationStatus {
  if (pub.status) return pub.status
  const text = (pub.cvStatus ?? '').toLowerCase()
  if (/submitted|under review|in review|revis/.test(text)) return 'under_review'
  if (/accepted|forthcoming|to appear|in press/.test(text)) return 'accepted'
  return 'published'
}

/** Short venue badge, e.g. "CHI '26". Falls back to a trailing "(CSCW Companion '26)" in the venue. */
export function resolveVenueShort(pub: Pick<Publication, 'venueShort' | 'venue'>): string {
  if (pub.venueShort?.trim()) return pub.venueShort.trim()
  const match = pub.venue?.match(/\(([^()]*['‘’]\s?\d{2})\)\s*\.?\s*$/)
  return match ? match[1].replace(/[‘’]/g, '\'').trim() : ''
}

export interface PublicationLinks {
  pdf?: string
  doi?: string
  arxiv?: string
  slides?: string
  poster?: string
  video?: string
  code?: string
}

export const PUBLICATION_LINK_FIELDS: { key: keyof PublicationLinks; label: string; icon: string }[] = [
  { key: 'pdf', label: 'PDF', icon: 'mdi-file-pdf-box' },
  { key: 'doi', label: 'DOI', icon: 'mdi-link-variant' },
  { key: 'arxiv', label: 'arXiv', icon: 'mdi-file-document-outline' },
  { key: 'slides', label: 'Slides', icon: 'mdi-presentation' },
  { key: 'poster', label: 'Poster', icon: 'mdi-image-outline' },
  { key: 'video', label: 'Video', icon: 'mdi-play-circle-outline' },
  { key: 'code', label: 'Code', icon: 'mdi-code-braces' },
]

export interface PublicationAuthor {
  name: string
  bold: boolean
}

export interface Publication {
  id?: string
  title: string
  authors: PublicationAuthor[]
  venue: string
  /** Short venue badge, e.g. "CHI '26" or "CSCW '26 Companion" */
  venueShort?: string
  year: number
  type: PublicationType
  typeScheme?: typeof PUBLICATION_TYPE_SCHEME
  status?: PublicationStatus
  abstract?: string
  links: PublicationLinks
  featured: boolean
  includeInCv: boolean
  cvOrder: number
  /** Legacy CV category from older records (used to infer `type`) */
  cvCategory?: PublicationCvCategory | ''
  cvStatus?: string
  acceptanceRate?: string
  scholarNote?: string
  isJournalModel?: boolean
  /** Thumbnail image URL or compressed Base64 data URL (e.g. from publication page / og:image) */
  thumbnailUrl?: string
  /** Link to the publication source page (ACM DL, DOI landing page, etc.) */
  sourceUrl?: string
  createdAt?: string
}

export interface NewsItem {
  id?: string
  title: string
  body: string
  date: string
  imageUrl: string
  published: boolean
  createdAt?: string
}

export const defaultSiteSettings = (): SiteSettings => ({
  name: 'Sunday O. Onwuchekwa',
  title: 'PhD Student in Computer Science | HCI & Human-Centered Computing Researcher',
  tagline:
    'I investigate how technology shapes human experiences, communities, and spiritual practices. Through qualitative and participatory approaches, I seek to design sociotechnical systems that are inclusive, culturally responsive, and supportive of human flourishing.',
  email: 'sunday.onwuchekwa@byu.edu',
  phone: '',
  websiteUrl: 'https://sunday-onwuchekwa.web.app',
  affiliation: 'Brigham Young University',
  location: '',
  announcement: '',
  beyondResearch: '',
  socialLinks: [
    { platform: 'Google Scholar', url: 'https://scholar.google.com', icon: 'mdi-school' },
    { platform: 'ORCID', url: 'https://orcid.org', icon: 'mdi-identifier' },
    { platform: 'LinkedIn', url: 'https://linkedin.com', icon: 'mdi-linkedin' },
  ],
  profileImageUrl: '',
  pageVisibility: defaultPageVisibility(),
})

export const defaultAbout = (): About => ({
  bio: '',
  researchInterests: [],
  education: [],
})
