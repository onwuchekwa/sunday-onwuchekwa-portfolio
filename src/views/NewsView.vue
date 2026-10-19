<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { newsSummary } from '@/utils/news'
import { parseLocalDate } from '@/utils/date'
import UnderConstruction from '@/components/UnderConstruction.vue'

const { newsItems, load, loading, error, latestNews } = useNews()
const route = useRoute()
const router = useRouter()

/** Reverse-chronological, grouped by year, as on academic sites. */
const years = computed(() => {
  const groups: { year: number; items: { id: string; date: string; title: string; summary: string }[] }[] = []
  for (const item of latestNews(newsItems.value.length)) {
    const date = parseLocalDate(item.date)
    const year = date.getFullYear()
    let group = groups.find((g) => g.year === year)
    if (!group) {
      group = { year, items: [] }
      groups.push(group)
    }
    group.items.push({
      id: item.id ?? '',
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      title: item.title,
      summary: newsSummary(item.body),
    })
  }
  return groups
})

watch(error, (e) => {
  if (e) router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
})

onMounted(() => load(true))
</script>

<template>
  <v-container class="news-page py-10 py-md-12">
    <header class="mb-8">
      <h1 class="text-h3 font-weight-bold text-primary mb-2">News</h1>
      <p class="text-body-1 text-body-readable mb-0">
        Paper acceptances, talks, awards, and research milestones.
      </p>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <template v-else-if="years.length">
      <section v-for="group in years" :key="group.year" class="news-year" :aria-labelledby="`news-${group.year}`">
        <h2 :id="`news-${group.year}`" class="news-year__title">{{ group.year }}</h2>
        <ol class="news-list">
          <li v-for="item in group.items" :key="item.id" class="news-item">
            <time class="news-item__date">{{ item.date }}</time>
            <div class="news-item__body">
              <router-link :to="`/news/${item.id}`" class="news-item__title">{{ item.title }}</router-link>
              <p v-if="item.summary" class="news-item__summary">{{ item.summary }}</p>
            </div>
          </li>
        </ol>
      </section>
    </template>

    <UnderConstruction v-else title="The News page is under construction" />
  </v-container>
</template>

<style scoped>
.news-page {
  max-width: 860px;
}

.news-year {
  margin-bottom: 2.25rem;
}

.news-year__title {
  font-size: 1.5rem;
  color: var(--heading);
  padding-bottom: 0.5rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid var(--rule-strong);
}

.news-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.news-item {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.875rem 0;
}

.news-item + .news-item {
  border-top: 1px solid var(--rule);
}

.news-item__date {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.6;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.news-item__title {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--text-strong);
  text-decoration: none;
}

.news-item__title:hover,
.news-item__title:focus-visible {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.news-item__summary {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-body);
}

@media (max-width: 599.98px) {
  .news-item {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.125rem;
  }
}
</style>
