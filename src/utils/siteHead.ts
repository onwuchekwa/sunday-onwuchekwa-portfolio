import type { SiteSettings } from '@/types/content'

export function buildSiteTitle(settings: Pick<SiteSettings, 'name' | 'title'>): string {
  const name = settings.name?.trim()
  const title = settings.title?.trim()
  if (name && title) return `${name} | ${title}`
  return name || title || 'Portfolio'
}

export function applySiteHead(settings: Pick<SiteSettings, 'name' | 'title' | 'tagline'>): void {
  document.title = buildSiteTitle(settings)

  const description = settings.tagline?.trim()
  if (!description) return

  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', description)
}
