<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import { useCv } from '@/composables/useCv'
import { useAbout } from '@/composables/useAbout'
import { toResearchInterestDisplay } from '@/utils/cvFormat'
import { resolvePublicationStatus } from '@/types/content'
import PublicationCard from '@/components/PublicationCard.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { publications, load: loadPubs, latestPublications } = usePublications()
const { cv, load: loadCv, visibleEntries } = useCv()
const { about, load: loadAbout } = useAbout()

const firstName = computed(() => settings.value.name.trim().split(/\s+/)[0] ?? '')

/** Blank lines separate paragraphs in the bio. */
const bioParagraphs = computed(() =>
  (about.value.bio ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean),
)

const SELECTED_PUBLICATION_COUNT = 2

/** Featured papers first; otherwise the most recent work that isn't still under review. */
const selectedPublications = computed(() => {
  const byRecency = latestPublications(publications.value.length)
  const featured = byRecency.filter((p) => p.featured)
  const pool = featured.length
    ? featured
    : byRecency.filter((p) => resolvePublicationStatus(p) !== 'under_review')
  return pool.slice(0, SELECTED_PUBLICATION_COUNT)
})

const researchThemes = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  if (!section) return []
  return visibleEntries(section)
    .map(toResearchInterestDisplay)
    .filter((item) => item.title)
})

const scholarUrl = computed(
  () =>
    settings.value.socialLinks.find((link) => /scholar/i.test(link.platform) && link.url)?.url ??
    '',
)

const pageVisible = computed(() => settings.value.pageVisibility)

onMounted(async () => {
  await Promise.all([loadSettings(), loadPubs(), loadCv(), loadAbout()])
})
</script>

<template>
  <div class="home py-8 py-md-12">
    <header class="mb-6">
      <h1 class="text-h2 font-weight-bold text-primary mb-2">Hi, I’m {{ firstName }}</h1>
      <p class="home-role mb-0">{{ settings.title }}</p>
    </header>

    <div v-if="settings.announcement" class="home-callout mb-8" role="note">
      <p class="mb-2">{{ settings.announcement }}</p>
      <div class="home-callout__links">
        <a v-if="settings.email" :href="`mailto:${settings.email}`">{{ settings.email }}</a>
        <router-link v-if="pageVisible.cv !== false" to="/cv">CV</router-link>
        <a v-if="scholarUrl" :href="scholarUrl" target="_blank" rel="noopener noreferrer">Google Scholar</a>
      </div>
    </div>

    <div v-if="bioParagraphs.length" class="home-bio">
      <p v-for="(paragraph, index) in bioParagraphs" :key="index">{{ paragraph }}</p>
    </div>

    <section v-if="researchThemes.length" class="home-section" aria-labelledby="home-research">
      <h2 id="home-research" class="home-heading">Research</h2>
      <table class="home-themes">
        <thead>
          <tr>
            <th scope="col">Theme</th>
            <th scope="col">What I study</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="theme in researchThemes" :key="theme.title">
            <th scope="row">
              <v-icon :icon="theme.icon" size="20" class="home-themes__icon" />
              {{ theme.title }}
            </th>
            <td>{{ theme.description }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section
      v-if="selectedPublications.length && pageVisible.publications !== false"
      class="home-section"
      aria-labelledby="home-pubs"
    >
      <h2 id="home-pubs" class="home-heading">Selected Publications</h2>
      <PublicationCard
        v-for="pub in selectedPublications"
        :key="pub.id"
        :publication="pub"
        :show-abstract="false"
        class="home-pub"
      />
      <router-link to="/publications" class="home-more mt-2">
        All publications <v-icon icon="mdi-arrow-right" size="16" />
      </router-link>
    </section>

    <section v-if="settings.beyondResearch" class="home-section" aria-labelledby="home-beyond">
      <h2 id="home-beyond" class="home-heading">Beyond Research</h2>
      <p class="home-body mb-0">{{ settings.beyondResearch }}</p>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 780px;
}

.home-role {
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--byu-royal);
}

.home-callout {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border-left: 4px solid var(--byu-royal);
  background: rgba(189, 214, 230, 0.35);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--byu-navy);
  font-weight: 500;
}

.home-callout__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.875rem;
  font-weight: 400;
}

.home-callout__links a,
.home-more {
  color: var(--byu-royal) !important;
  text-underline-offset: 3px;
}

.home-bio p {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text-body);
  white-space: pre-line;
  margin-bottom: 1rem;
}

.home-bio p:first-child {
  font-size: 1.125rem;
}

.home-body {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text-body);
}

.home-more {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
}

.home-more:hover {
  text-decoration: underline;
}

.home-section {
  margin-top: 3rem;
}

.home-heading {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--byu-navy);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid var(--byu-light-blue);
}

.home-themes {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.home-themes thead th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-body);
  padding: 0.5rem 0.75rem 0.5rem 0;
}

.home-themes tbody th,
.home-themes td {
  padding: 0.875rem 0.75rem 0.875rem 0;
  vertical-align: top;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.home-themes tbody th {
  width: 36%;
  text-align: left;
  font-weight: 600;
  color: var(--byu-navy);
}

.home-themes td {
  color: var(--text-body);
}

.home-themes__icon {
  color: var(--byu-royal);
  margin-right: 0.375rem;
  vertical-align: -3px;
}

@media (max-width: 599.98px) {
  .home-themes thead {
    display: none;
  }

  .home-themes tbody tr {
    display: block;
    padding: 0.75rem 0;
    border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  }

  .home-themes tbody th,
  .home-themes td {
    display: block;
    width: auto;
    padding: 0;
    border: 0;
  }

  .home-themes td {
    margin-top: 0.25rem;
  }
}

.home-pub {
  padding: 1.125rem 0;
}

.home-pub + .home-pub {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}
</style>
