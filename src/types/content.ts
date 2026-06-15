export interface SocialLink {
  platform: string
  url: string
  icon?: string
}

/** Public pages that can be toggled on/off from Admin → Settings. */
export type PublicPageId = 'about' | 'publications' | 'news' | 'cv' | 'contact'

export type PageVisibility = Record<PublicPageId, boolean>

export const PUBLIC_PAGES: { id: PublicPageId; title: string }[] = [
  { id: 'about', title: 'About' },
  { id: 'publications', title: 'Publications' },
  { id: 'news', title: 'News' },
  { id: 'cv', title: 'CV' },
  { id: 'contact', title: 'Contact' },
]

export const defaultPageVisibility = (): PageVisibility => ({
  about: true,
  publications: true,
  news: true,
  cv: true,
  contact: true,
})

export interface SiteSettings {
  name: string
  title: string
  tagline: string
  email: string
  phone: string
  /** Personal website URL shown on CV header and contact areas */
  websiteUrl: string
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

export type PublicationType = 'paper' | 'poster' | 'workshop' | 'other'

export type PublicationCvCategory =
  | 'journal_article'
  | 'conference_proceedings'
  | 'technology_demonstration'
  | 'workshop_extended_abstract'
  | 'poster_extended_abstract'
  | 'archived_abstract'

export const PUBLICATION_CV_CATEGORIES: {
  value: PublicationCvCategory
  title: string
  order: number
}[] = [
  { value: 'journal_article', title: 'Journal Articles', order: 0 },
  { value: 'conference_proceedings', title: 'Conference Proceedings', order: 1 },
  { value: 'technology_demonstration', title: 'Technology Demonstration (Archived Abstract)', order: 2 },
  {
    value: 'workshop_extended_abstract',
    title: 'Archived Extended Abstracts for Workshops Organized',
    order: 3,
  },
  {
    value: 'poster_extended_abstract',
    title: 'Archived Extended Abstracts (and presented as posters)',
    order: 4,
  },
  { value: 'archived_abstract', title: 'Archived Abstracts (and presented as posters)', order: 5 },
]

export function defaultCvCategoryForType(type: PublicationType): PublicationCvCategory {
  switch (type) {
    case 'poster':
      return 'poster_extended_abstract'
    case 'workshop':
      return 'workshop_extended_abstract'
    case 'other':
      return 'archived_abstract'
    default:
      return 'conference_proceedings'
  }
}

export function resolvePublicationCvCategory(pub: Publication): PublicationCvCategory {
  return pub.cvCategory ?? defaultCvCategoryForType(pub.type)
}

export interface PublicationLinks {
  pdf?: string
  doi?: string
  arxiv?: string
}

export interface Publication {
  id?: string
  title: string
  authors: string
  venue: string
  year: number
  type: PublicationType
  abstract?: string
  links: PublicationLinks
  featured: boolean
  includeInCv: boolean
  cvOrder: number
  cvCategory?: PublicationCvCategory
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
