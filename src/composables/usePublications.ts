import { ref } from 'vue'
import {
  getPublications,
  addPublication,
  updatePublication,
  deletePublication,
} from '@/firebase/firestore'
import type { Publication } from '@/types/content'
import { groupPublicationsByCategory, type PublicationCategoryGroup } from '@/utils/cvFormat'

export function usePublications() {
  const publications = ref<Publication[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      publications.value = await getPublications()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load publications'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Publication, 'id'>) {
    const id = await addPublication(data)
    publications.value = [{ ...data, id }, ...publications.value]
    return id
  }

  async function update(id: string, data: Partial<Publication>) {
    await updatePublication(id, data)
    const index = publications.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      publications.value[index] = { ...publications.value[index], ...data, id }
    }
  }

  async function remove(id: string) {
    await deletePublication(id)
    publications.value = publications.value.filter((p) => p.id !== id)
  }

  function cvPublications(): Publication[] {
    return publications.value
      .filter((p) => p.includeInCv)
      .sort((a, b) => (a.cvOrder ?? 0) - (b.cvOrder ?? 0) || b.year - a.year)
  }

  function publicationsByCategory(): PublicationCategoryGroup[] {
    return groupPublicationsByCategory(publications.value)
  }

  function cvPublicationsByCategory(): PublicationCategoryGroup[] {
    return groupPublicationsByCategory(cvPublications())
  }

  function latestPublications(count = 2): Publication[] {
    return [...publications.value]
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        const aDate = a.createdAt ?? ''
        const bDate = b.createdAt ?? ''
        return bDate.localeCompare(aDate)
      })
      .slice(0, count)
  }

  return {
    publications,
    loading,
    error,
    load,
    create,
    update,
    remove,
    cvPublications,
    cvPublicationsByCategory,
    publicationsByCategory,
    latestPublications,
  }
}
