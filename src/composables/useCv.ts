import { ref } from 'vue'
import { getCvDocument, saveCvDocument } from '@/firebase/firestore'
import {
  createDefaultCvDocument,
  isEntryVisible,
  normalizeCvDocument,
  type CvDocument,
  type CvSection,
} from '@/types/cv'

export function useCv() {
  const cv = ref<CvDocument>(createDefaultCvDocument())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await getCvDocument()
      if (data) {
        cv.value = normalizeCvDocument(data)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load CV'
    } finally {
      loading.value = false
    }
  }

  async function save(data: CvDocument) {
    const normalized = normalizeCvDocument(data)
    await saveCvDocument(normalized)
    cv.value = { ...normalized, lastUpdated: new Date().toISOString() }
  }

  function visibleSections(): CvSection[] {
    return [...cv.value.sections]
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
  }

  function visibleEntries(section: CvSection): Record<string, unknown>[] {
    return section.entries.filter(isEntryVisible)
  }

  function sectionHasVisibleEntries(section: CvSection): boolean {
    return visibleEntries(section).length > 0
  }

  return { cv, loading, error, load, save, visibleSections, visibleEntries, sectionHasVisibleEntries }
}
