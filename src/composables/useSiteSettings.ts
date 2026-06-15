import { ref } from 'vue'
import { getSiteSettings, saveSiteSettings } from '@/firebase/firestore'
import {
  defaultPageVisibility,
  defaultSiteSettings,
  type SiteSettings,
} from '@/types/content'
import { applySiteHead } from '@/utils/siteHead'

const cache = ref<SiteSettings | null>(null)
let loadOncePromise: Promise<SiteSettings> | null = null

function mergeWithDefaults(data: Partial<SiteSettings>): SiteSettings {
  return {
    ...defaultSiteSettings(),
    ...data,
    pageVisibility: { ...defaultPageVisibility(), ...(data.pageVisibility ?? {}) },
  }
}

export function useSiteSettings() {
  const settings = ref<SiteSettings>(cache.value ?? defaultSiteSettings())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await getSiteSettings()
      if (data) {
        const merged = mergeWithDefaults(data)
        settings.value = merged
        cache.value = merged
        applySiteHead(merged)
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
    applySiteHead(data)
  }

  return { settings, loading, error, load, save }
}

export function getCachedSiteSettings(): SiteSettings {
  return cache.value ?? defaultSiteSettings()
}

/** Load settings once (cached) — used by the router guard for page visibility. */
export async function loadSiteSettingsOnce(): Promise<SiteSettings> {
  if (cache.value) return cache.value
  if (!loadOncePromise) {
    loadOncePromise = getSiteSettings()
      .then((data) => {
        const merged = data ? mergeWithDefaults(data) : defaultSiteSettings()
        cache.value = merged
        applySiteHead(merged)
        return merged
      })
      .catch(() => {
        loadOncePromise = null
        return defaultSiteSettings()
      })
  }
  return loadOncePromise
}
