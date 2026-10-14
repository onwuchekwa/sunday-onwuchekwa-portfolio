import {
  PUBLICATION_TYPE_GROUPS,
  resolvePublicationStatus,
  type Publication,
} from '@/types/content'

export type PublicationGrouping = 'year' | 'type'

export interface PublicationListGroup {
  id: string
  title: string
  publications: Publication[]
}

const UNDER_REVIEW_TITLE = 'Under Review'

function byRecency(a: Publication, b: Publication): number {
  if (b.year !== a.year) return b.year - a.year
  if ((a.cvOrder ?? 0) !== (b.cvOrder ?? 0)) return (a.cvOrder ?? 0) - (b.cvOrder ?? 0)
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
}

/** Group for the public Publications page. Under-review work always leads, in either view. */
export function groupPublications(
  publications: Publication[],
  grouping: PublicationGrouping,
): PublicationListGroup[] {
  const sorted = [...publications].sort(byRecency)
  const underReview = sorted.filter((p) => resolvePublicationStatus(p) === 'under_review')
  const rest = sorted.filter((p) => resolvePublicationStatus(p) !== 'under_review')

  const groups: PublicationListGroup[] = []
  if (underReview.length) {
    groups.push({ id: 'under-review', title: UNDER_REVIEW_TITLE, publications: underReview })
  }

  if (grouping === 'year') {
    const years = [...new Set(rest.map((p) => p.year))]
    for (const year of years) {
      groups.push({
        id: `year-${year}`,
        title: String(year),
        publications: rest.filter((p) => p.year === year),
      })
    }
    return groups
  }

  for (const bucket of PUBLICATION_TYPE_GROUPS) {
    const items = rest.filter((p) => bucket.types.includes(p.type))
    if (items.length) groups.push({ id: `type-${bucket.id}`, title: bucket.title, publications: items })
  }
  return groups
}
