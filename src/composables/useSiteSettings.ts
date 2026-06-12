import { ref } from 'vue'
import { getSiteSettings, saveSiteSettings } from '@/firebase/firestore'
import { defaultSiteSettings, type SiteSettings } from '@/types/content'

const cache = ref<SiteSettings | null>(null)

export function useSiteSettings() {
  const settings = ref<SiteSettings>(defaultSiteSettings())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await getSiteSettings()
      if (data) {
        settings.value = data
        cache.value = data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  async function save(data: SiteSettings) {
    await saveSiteSettings(data)
    settings.value = data
    cache.value = data
  }

  return { settings, loading, error, load, save }
}

export function getCachedSiteSettings(): SiteSettings {
  return cache.value ?? defaultSiteSettings()
}
