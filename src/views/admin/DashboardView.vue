<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useNews } from '@/composables/useNews'
import { useCv } from '@/composables/useCv'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { resolvePublicationStatus } from '@/types/content'
import { formatLongDate, parseLocalDate } from '@/utils/date'
import { publicSiteOrigin } from '@/utils/hosts'

const { publications, load: loadPubs } = usePublications()
const { newsItems, load: loadNews, latestNews } = useNews()
const { cv, load: loadCv } = useCv()
const { settings, load: loadSettings } = useSiteSettings()
const ready = ref(false)

onMounted(async () => {
  await Promise.all([loadPubs(), loadNews(), loadCv(), loadSettings()])
  ready.value = true
})

const firstName = computed(() => settings.value.name.trim().split(/\s+/)[0] ?? '')
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

interface Task {
  id: string
  text: string
  detail: string
  to: RouteLocationRaw
  action: string
}

/** Things worth doing next, worked out from the content itself. */
const tasks = computed<Task[]>(() => {
  const list: Task[] = []
  const s = settings.value

  if (!s.headline?.trim()) {
    list.push({
      id: 'headline',
      text: 'Add a headline to your home page',
      detail: 'One sentence about what you study, shown large at the top.',
      to: { name: 'admin-home' },
      action: 'Edit home page',
    })
  }
  const descriptionLength = (s.tagline ?? '').trim().length
  if (!descriptionLength || descriptionLength > 170) {
    list.push({
      id: 'description',
      text: descriptionLength ? 'Shorten your site description' : 'Write a site description',
      detail: 'It’s what Google and link previews show. About 120–160 characters works best.',
      to: { name: 'admin-settings' },
      action: 'Open settings',
    })
  }
  if (!s.profileImageUrl) {
    list.push({
      id: 'photo',
      text: 'Add a profile photo',
      detail: 'It appears in the sidebar on every page.',
      to: { name: 'admin-settings' },
      action: 'Open settings',
    })
  }

  for (const pub of publications.value) {
    const short = pub.title.length > 60 ? `${pub.title.slice(0, 57)}…` : pub.title
    if (!pub.thumbnailUrl) {
      list.push({
        id: `thumb-${pub.id}`,
        text: `Add a thumbnail to “${short}”`,
        detail: 'Make one from the paper’s PDF in a couple of clicks.',
        to: { name: 'admin-publication-edit', params: { id: pub.id } },
        action: 'Edit paper',
      })
    }
    if (!pub.abstract?.trim() && resolvePublicationStatus(pub) !== 'under_review') {
      list.push({
        id: `abstract-${pub.id}`,
        text: `Add the abstract for “${short}”`,
        detail: 'With a DOI, “Fill details” can fetch it for you.',
        to: { name: 'admin-publication-edit', params: { id: pub.id } },
        action: 'Edit paper',
      })
    }
  }

  const drafts = newsItems.value.filter((n) => !n.published)
  if (drafts.length) {
    list.push({
      id: 'drafts',
      text: drafts.length === 1 ? `Finish your draft “${drafts[0].title}”` : `${drafts.length} news drafts waiting`,
      detail: 'Drafts stay hidden until you turn on Published.',
      to: { name: 'admin-news' },
      action: 'Open news',
    })
  }
  const latest = latestNews(1).find((n) => n.published)
  const daysSincePost = latest ? (Date.now() - parseLocalDate(latest.date).getTime()) / 86_400_000 : Infinity
  if (daysSincePost > 60) {
    list.push({
      id: 'news-stale',
      text: latest ? 'It’s been a while since your last news post' : 'Post your first news item',
      detail: 'Talks, acceptances, and milestones keep the site feeling current.',
      to: { name: 'admin-news', query: { new: '1' } },
      action: 'Post news',
    })
  }

  const research = cv.value.sections.find((sec) => sec.id === 'researchInterests')
  if (research && research.entries.some((e) => !String(e.link ?? '').trim())) {
    list.push({
      id: 'research-links',
      text: 'Link your research cards to a paper or post',
      detail: 'Linked cards on the home page become clickable.',
      to: { name: 'admin-cv' },
      action: 'Open CV Builder',
    })
  }
  return list
})

const summary = computed(() => {
  const pubs = publications.value
  const published = newsItems.value.filter((n) => n.published).length
  return [
    {
      label: 'Publications',
      value: pubs.length,
      detail: `${pubs.filter((p) => p.featured).length} featured · ${pubs.filter((p) => resolvePublicationStatus(p) === 'under_review').length} under review`,
      to: { name: 'admin-publications' },
    },
    {
      label: 'News posts',
      value: published,
      detail: newsItems.value.length > published ? `${newsItems.value.length - published} drafts` : 'all published',
      to: { name: 'admin-news' },
    },
    {
      label: 'CV',
      value: cv.value.sections.filter((s) => s.visible).length,
      detail: cv.value.lastUpdated ? `sections · saved ${formatLongDate(cv.value.lastUpdated.slice(0, 10))}` : 'visible sections',
      to: { name: 'admin-cv' },
    },
  ]
})

const quickActions = [
  { title: 'Add a publication', icon: 'mdi-plus-box-outline', to: { name: 'admin-publication-new' } },
  { title: 'Post news', icon: 'mdi-bullhorn-outline', to: { name: 'admin-news', query: { new: '1' } } },
  { title: 'Edit home page', icon: 'mdi-home-edit-outline', to: { name: 'admin-home' } },
]
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__hello">
      <div>
        <h1 class="dashboard__title">{{ greeting }}{{ firstName ? `, ${firstName}` : '' }}</h1>
        <p class="dashboard__subtitle">
          Changes you save go live right away. Link previews and search snapshots refresh every night.
        </p>
      </div>
      <v-btn :href="publicSiteOrigin" target="_blank" rel="noopener" variant="tonal" prepend-icon="mdi-open-in-new">
        View your site
      </v-btn>
    </header>

    <section class="dashboard__card" aria-labelledby="todo-title">
      <div class="d-flex align-center justify-space-between mb-3">
        <h2 id="todo-title" class="dashboard__section-title">To do</h2>
        <span v-if="ready && tasks.length" class="dashboard__count">{{ tasks.length }}</span>
      </div>
      <v-progress-linear v-if="!ready" indeterminate color="primary" />
      <div v-else-if="!tasks.length" class="dashboard__done">
        <v-icon icon="mdi-check-circle" size="28" />
        <div>
          <p class="dashboard__done-title">You’re all set</p>
          <p class="mb-0">Your site has everything it needs. Post news when something happens.</p>
        </div>
      </div>
      <ul v-else class="tasks">
        <li v-for="task in tasks" :key="task.id" class="task">
          <v-icon icon="mdi-checkbox-blank-circle-outline" size="18" class="task__bullet" />
          <div class="task__text">
            <p class="task__title">{{ task.text }}</p>
            <p class="task__detail">{{ task.detail }}</p>
          </div>
          <v-btn :to="task.to" variant="text" size="small" color="secondary" append-icon="mdi-chevron-right">
            {{ task.action }}
          </v-btn>
        </li>
      </ul>
    </section>

    <div class="dashboard__grid">
      <router-link v-for="item in summary" :key="item.label" :to="item.to" class="dashboard__stat">
        <span class="dashboard__stat-label">{{ item.label }}</span>
        <span class="dashboard__stat-value">{{ item.value }}</span>
        <span class="dashboard__stat-detail">{{ item.detail }}</span>
      </router-link>
    </div>

    <div class="dashboard__actions">
      <v-btn
        v-for="action in quickActions"
        :key="action.title"
        :to="action.to"
        variant="outlined"
        :prepend-icon="action.icon"
      >
        {{ action.title }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.25rem;
}

.dashboard__hello {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--byu-navy);
}

.dashboard__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--text-body);
}

.dashboard__card {
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: #ffffff;
}

.dashboard__section-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--byu-navy);
}

.dashboard__count {
  min-width: 1.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #8a5300;
  background: #fff4e0;
}

.tasks {
  list-style: none;
  margin: 0;
  padding: 0;
}

.task {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
}

.task + .task {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.task__bullet {
  color: rgba(var(--v-theme-on-surface), 0.35);
  flex-shrink: 0;
}

.task__text {
  flex: 1 1 auto;
  min-width: 0;
}

.task__title {
  margin: 0;
  font-weight: 600;
  color: var(--text-strong);
}

.task__detail {
  margin: 0.125rem 0 0;
  font-size: 0.875rem;
  color: var(--text-body);
}

.dashboard__done {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-body);
}

.dashboard__done .v-icon {
  color: #2e7d32;
}

.dashboard__done-title {
  margin: 0;
  font-weight: 700;
  color: var(--text-strong);
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.dashboard__stat {
  display: grid;
  gap: 0.125rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: #ffffff;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dashboard__stat:hover {
  border-color: rgba(var(--v-theme-secondary), 0.35);
  box-shadow: 0 4px 14px rgba(0, 46, 93, 0.06);
}

.dashboard__stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.dashboard__stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--byu-navy);
}

.dashboard__stat-detail {
  font-size: 0.875rem;
  color: var(--text-body);
}

.dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
