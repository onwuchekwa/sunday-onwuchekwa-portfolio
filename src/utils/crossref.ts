/**
 * Look up a paper's details by DOI from Crossref's free public API (no key needed; ACM, IEEE,
 * Springer, and most publishers register their DOIs there).
 */
import type { PublicationType } from '@/types/content'

export interface DoiDetails {
  doi: string
  title: string
  authors: string[]
  venue: string
  year: number | null
  abstract: string
  type: PublicationType | null
}

/** Pull the DOI out of whatever was pasted: a bare DOI, a doi.org link, or an ACM DL URL. */
export function extractDoi(input: string): string | null {
  let text = input.trim()
  try {
    text = decodeURIComponent(text)
  } catch {
    // Not URL-encoded; use as is.
  }
  const match = text.match(/10\.\d{4,9}\/[^\s"'<>?#]+/)
  return match ? match[0].replace(/[.,;)\]]+$/, '') : null
}

interface CrossrefWork {
  title?: string[]
  author?: { given?: string; family?: string; name?: string }[]
  'container-title'?: string[]
  event?: { name?: string }
  issued?: { 'date-parts'?: (number | null)[][] }
  published?: { 'date-parts'?: (number | null)[][] }
  abstract?: string
  type?: string
}

export async function fetchDoiDetails(doi: string): Promise<DoiDetails> {
  const path = doi.split('/').map(encodeURIComponent).join('/')
  let response: Response
  try {
    response = await fetch(`https://api.crossref.org/works/${path}`)
  } catch {
    throw new Error('Couldn’t reach Crossref. Check your connection and try again.')
  }
  if (response.status === 404) {
    throw new Error('Crossref doesn’t know this DOI. New DOIs can take a few days to appear.')
  }
  if (!response.ok) throw new Error(`Crossref returned an error (${response.status}). Try again later.`)

  const work = ((await response.json()) as { message: CrossrefWork }).message
  const year = work.issued?.['date-parts']?.[0]?.[0] ?? work.published?.['date-parts']?.[0]?.[0] ?? null

  return {
    doi,
    title: plainText(work.title?.[0] ?? ''),
    authors: (work.author ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name || '')
      .map((name) => name.trim())
      .filter(Boolean),
    venue: plainText(work['container-title']?.[0] || work.event?.name || ''),
    year,
    abstract: plainText(work.abstract ?? ''),
    type: work.type === 'journal-article' ? 'journal' : null,
  }
}

/** Crossref titles and abstracts can carry JATS/HTML markup. */
function plainText(text: string): string {
  return text
    .replace(/<jats:title>[\s\S]*?<\/jats:title>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}
