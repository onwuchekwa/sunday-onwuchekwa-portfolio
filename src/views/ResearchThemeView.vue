<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useCv } from '@/composables/useCv'
import { toResearchInterestDisplay } from '@/utils/cvFormat'
import { setPageHead } from '@/utils/siteHead'
import PublicationCard from '@/components/PublicationCard.vue'

const route = useRoute()
const { publications, load: loadPubs } = usePublications()
const { cv, load: loadCv, visibleEntries } = useCv()
const loaded = ref(false)

onMounted(async () => {
  await Promise.all([loadPubs(), loadCv()])
  loaded.value = true
})

const themes = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  return section ? visibleEntries(section).map(toResearchInterestDisplay).filter((t) => t.title) : []
})

/** By current title (the URL), or by id so links survive a rename. */
const theme = computed(() => {
  const slug = String(route.params.slug ?? '')
  return themes.value.find((t) => t.slug === slug) ?? themes.value.find((t) => t.id === slug)
})

const papers = computed(() =>
  publications.value
    .filter((p) => theme.value && p.themes?.includes(theme.value.id))
    .sort((a, b) => b.year - a.year || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
)

const otherThemes = computed(() => themes.value.filter((t) => t.id !== theme.value?.id))

/** Each paper's tags, minus this page's own theme. */
function tagsFor(themeIds: string[] | undefined) {
  return themes.value.filter((t) => t.id !== theme.value?.id && themeIds?.includes(t.id))
}

watch([theme, loaded], () => {
  if (!loaded.value) return
  setPageHead(
    theme.value
      ? { title: theme.value.title, description: theme.value.description || `Publications on ${theme.value.title}.` }
      : { title: 'Research theme not found', noindex: true },
  )
})
</script>

<template>
  <v-container class="theme-page py-10 py-md-12">
    <router-link to="/publications" class="theme-page__back">
      <v-icon icon="mdi-arrow-left" size="16" /> All publications
    </router-link>

    <template v-if="!loaded" />

    <template v-else-if="theme">
      <header class="theme-page__header">
        <p class="theme-page__eyebrow">Research theme</p>
        <h1 class="theme-page__title">{{ theme.title }}</h1>
        <p v-if="theme.description" class="theme-page__lede">{{ theme.description }}</p>
      </header>

      <section aria-labelledby="theme-papers">
        <h2 id="theme-papers" class="theme-page__heading">
          Publications <span class="theme-page__count">{{ papers.length }}</span>
        </h2>
        <PublicationCard
          v-for="pub in papers"
          :key="pub.id"
          :publication="pub"
          :themes="tagsFor(pub.themes)"
          class="theme-page__paper"
        />
        <p v-if="!papers.length" class="theme-page__empty">Papers on this theme are on their way.</p>
      </section>

      <nav v-if="otherThemes.length" class="theme-page__others" aria-label="Other research themes">
        <span class="theme-page__others-label">Other themes</span>
        <router-link v-for="other in otherThemes" :key="other.id" :to="`/research/${other.slug}`" class="theme-tag">
          {{ other.title }}
        </router-link>
      </nav>
    </template>

    <div v-else class="theme-page__missing">
      <h1 class="theme-page__title">Theme not found</h1>
      <p>This research theme may have been renamed or removed.</p>
      <router-link to="/publications">See all publications</router-link>
    </div>
  </v-container>
</template>

<style scoped>
.theme-page {
  max-width: 860px;
}

.theme-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--accent) !important;
  text-decoration: none;
}

.theme-page__back:hover {
  text-decoration: underline;
}

.theme-page__header {
  margin-bottom: 2.25rem;
}

.theme-page__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.theme-page__title {
  margin: 0;
  font-size: clamp(2rem, 1.6rem + 1.6vw, 2.625rem);
  line-height: 1.15;
  color: var(--heading);
}

.theme-page__lede {
  max-width: 62ch;
  margin: 0.875rem 0 0;
  font-size: 1.125rem;
  line-height: 1.65;
  color: var(--text-strong);
}

.theme-page__heading {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  padding-bottom: 0.5rem;
  font-size: 1.5rem;
  color: var(--heading);
  border-bottom: 1px solid var(--rule-strong);
}

.theme-page__count {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}

.theme-page__paper {
  padding: 1.25rem 0;
}

.theme-page__paper + .theme-page__paper {
  border-top: 1px solid var(--rule);
}

.theme-page__empty {
  margin: 1rem 0 0;
  color: var(--text-body);
}

.theme-page__others {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule);
}

.theme-page__others-label {
  margin-right: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.theme-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--rule-strong);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-body) !important;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.theme-tag:hover {
  border-color: var(--accent);
  color: var(--accent) !important;
}

.theme-page__missing p {
  margin: 0.75rem 0;
  color: var(--text-body);
}
</style>
