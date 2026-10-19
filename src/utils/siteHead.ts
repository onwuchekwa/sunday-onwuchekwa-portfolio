import type { SiteSettings } from '@/types/content'
import { publicSiteOrigin } from '@/utils/hosts'

type HeadSettings = Pick<SiteSettings, 'name' | 'title' | 'tagline'>

/** What a page says about itself; pages without one get the site-wide title and tagline. */
export interface PageHead {
  /** Shown as "<title> | <name>". */
  title?: string
  /** A function receives the site owner's name once settings have loaded. */
  description?: string | ((name: string) => string)
}

let siteSettings: HeadSettings | null = null
let pageHead: PageHead = {}

export function buildSiteTitle(settings: Pick<SiteSettings, 'name' | 'title'>): string {
  const name = settings.name?.trim()
  const title = settings.title?.trim()
  if (name && title) return `${name} | ${title}`
  return name || title || 'Portfolio'
}

/** Called whenever site settings load or change. */
export function applySiteHead(settings: HeadSettings): void {
  siteSettings = settings
  renderHead()
}

/** Called on each route change, and by views whose title depends on loaded data. */
export function setPageHead(head: PageHead): void {
  pageHead = head
  renderHead()
}

function renderHead(): void {
  const name = siteSettings?.name?.trim() || document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || ''

  if (pageHead.title) {
    document.title = name ? `${pageHead.title} | ${name}` : pageHead.title
  } else if (siteSettings) {
    document.title = buildSiteTitle(siteSettings)
  }

  const pageDescription =
    typeof pageHead.description === 'function' ? pageHead.description(name) : pageHead.description
  const description = pageDescription?.trim() || siteSettings?.tagline?.trim()
  if (description) setMeta('description', description)

  setCanonical(publicSiteOrigin + location.pathname)
}

function setMeta(name: string, content: string): void {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}
