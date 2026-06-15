import { ref } from 'vue'
import { getNewsItems, addNewsItem, updateNewsItem, deleteNewsItem } from '@/firebase/firestore'
import type { NewsItem } from '@/types/content'

export function useNews() {
  const newsItems = ref<NewsItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(publishedOnly = false) {
    loading.value = true
    error.value = null
    try {
      const items = await getNewsItems()
      newsItems.value = publishedOnly ? items.filter((n) => n.published) : items
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load news'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<NewsItem, 'id'>) {
    const id = await addNewsItem(data)
    newsItems.value = [{ ...data, id }, ...newsItems.value]
    return id
  }

  async function update(id: string, data: Partial<NewsItem>) {
    await updateNewsItem(id, data)
    const index = newsItems.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      newsItems.value[index] = { ...newsItems.value[index], ...data, id }
    }
  }

  async function remove(id: string) {
    await deleteNewsItem(id)
    newsItems.value = newsItems.value.filter((n) => n.id !== id)
  }

  function latestNews(count = 3): NewsItem[] {
    return [...newsItems.value]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count)
  }

  return { newsItems, loading, error, load, create, update, remove, latestNews }
}
