import type { CvGroup, CvGroupItem } from '@/components/cv/CvGroupedSection.vue'

/** Group already-sorted rows under their institution, keeping first-seen order. */
export function groupByInstitution(
  rows: { name: string; location: string; item: CvGroupItem }[],
): CvGroup[] {
  const groups: CvGroup[] = []
  for (const row of rows) {
    const key = row.name.trim().toLowerCase()
    const group = groups.find((g) => g.name.trim().toLowerCase() === key)
    if (group) {
      group.items.push(row.item)
      if (!group.location) group.location = row.location
    } else {
      groups.push({ name: row.name, location: row.location, items: [row.item] })
    }
  }
  return groups
}
