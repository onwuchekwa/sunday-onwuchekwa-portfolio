export interface SocialLink {
  platform: string
  url: string
  icon?: string
}

export interface SiteSettings {
  name: string
  title: string
  tagline: string
  email: string
  socialLinks: SocialLink[]
  /** Base64 data URL (compressed) or external image URL */
  profileImageUrl: string
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
  name: 'Sunday Onwuchekwa',
  title: 'PhD Student, Computer Science',
  tagline: 'Human-Computer Interaction · Religion & Technology',
  email: 'sunday.onwuchekwa@example.edu',
  socialLinks: [
    { platform: 'Google Scholar', url: 'https://scholar.google.com', icon: 'mdi-school' },
    { platform: 'ORCID', url: 'https://orcid.org', icon: 'mdi-identifier' },
    { platform: 'LinkedIn', url: 'https://linkedin.com', icon: 'mdi-linkedin' },
  ],
  profileImageUrl: '',
})

export const defaultAbout = (): About => ({
  bio: '',
  researchInterests: [],
  education: [],
})
