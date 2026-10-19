<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { formatLongDate } from '@/utils/date'
import NewsBody from '@/components/NewsBody.vue'
import { newsSummary } from '@/utils/news'
import { setPageHead } from '@/utils/siteHead'

const route = useRoute()
const { newsItems, load, loading, latestNews } = useNews()

const ordered = computed(() => latestNews(newsItems.value.length))
const index = computed(() => ordered.value.findIndex((n) => n.id === route.params.id))
const item = computed(() => ordered.value[index.value])

/** Newer and older neighbours for in-article navigation. */
const newer = computed(() => (index.value > 0 ? ordered.value[index.value - 1] : undefined))
const older = computed(() => (index.value >= 0 ? ordered.value[index.value + 1] : undefined))

watch(
  item,
  (post) => {
    if (post) setPageHead({ title: post.title, description: newsSummary(post.body) })
  },
  { immediate: true },
)

onMounted(() => load(true))
</script>

<template>
  <v-container class="news-article py-10 py-md-12">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <article v-else-if="item">
      <router-link to="/news" class="news-article__back">
        <v-icon icon="mdi-arrow-left" size="16" /> All news
      </router-link>

      <time class="news-article__date">{{ formatLongDate(item.date) }}</time>
      <h1 class="news-article__title">{{ item.title }}</h1>

      <figure v-if="item.imageUrl" class="news-article__figure">
        <img :src="item.imageUrl" :alt="item.title" />
      </figure>

      <NewsBody :body="item.body" />

      <nav v-if="newer || older" class="news-article__nav" aria-label="More news">
        <router-link v-if="older" :to="`/news/${older.id}`" class="news-article__nav-link">
          <span class="news-article__nav-label">← Older</span>
          {{ older.title }}
        </router-link>
        <span v-else />
        <router-link
          v-if="newer"
          :to="`/news/${newer.id}`"
          class="news-article__nav-link news-article__nav-link--next"
        >
          <span class="news-article__nav-label">Newer →</span>
          {{ newer.title }}
        </router-link>
      </nav>
    </article>

    <v-alert v-else type="warning" variant="tonal">
      News post not found. <router-link to="/news">See all news</router-link>.
    </v-alert>
  </v-container>
</template>

<style scoped>
.news-article {
  max-width: 760px;
}

.news-article__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--accent) !important;
  text-decoration: none;
}

.news-article__back:hover {
  text-decoration: underline;
}

.news-article__date {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.375rem;
}

.news-article__title {
  font-size: clamp(1.75rem, 1.5rem + 1vw, 2.25rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--heading);
  margin: 0 0 1.5rem;
}

.news-article__figure {
  margin: 0 0 1.5rem;
}

.news-article__figure img {
  display: block;
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--rule);
}

.news-article__nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule);
}

.news-article__nav-link {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.45;
  color: var(--text-strong) !important;
  text-decoration: none;
}

.news-article__nav-link:hover {
  color: var(--accent) !important;
}

.news-article__nav-link--next {
  text-align: right;
}

.news-article__nav-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-body);
  margin-bottom: 0.125rem;
}

@media (max-width: 599.98px) {
  .news-article__nav {
    grid-template-columns: 1fr;
  }

  .news-article__nav-link--next {
    text-align: left;
  }
}
</style>
