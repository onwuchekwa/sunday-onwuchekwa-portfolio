import { ref } from 'vue'
import { getAbout, saveAbout } from '@/firebase/firestore'
import { defaultAbout, type About } from '@/types/content'

export function useAbout() {
  const about = ref<About>(defaultAbout())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await getAbout()
      if (data) {
        about.value = data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load about'
    } finally {
      loading.value = false
    }
  }

  async function save(data: About) {
    await saveAbout(data)
    about.value = data
  }

  return { about, loading, error, load, save }
}
