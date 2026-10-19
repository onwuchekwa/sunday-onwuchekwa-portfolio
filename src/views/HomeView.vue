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

const headline = computed(() => settings.value.headline?.trim() || `Hi, I’m ${firstName.value}`)

/** "PhD Student | HCI Researcher | BYU" reads better as a quiet line: "PhD Student · HCI Researcher · BYU". */
const roleParts = computed(() =>
  settings.value.title
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean),
)

/** Blank lines separate paragraphs in the bio. */
const bioParagraphs = computed(() =>
  (about.value.bio ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean),
)

const SELECTED_PUBLICATION_COUNT = 2

/** Featured papers first, then the most recent work that isn't still under review. */
const selectedPublications = computed(() => {
  const byRecency = latestPublications(publications.value.length)
  const featured = byRecency.filter((p) => p.featured)
  const others = byRecency.filter((p) => !p.featured && resolvePublicationStatus(p) !== 'under_review')
  return [...featured, ...others].slice(0, SELECTED_PUBLICATION_COUNT)
})

const researchThemes = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  if (!section) return []
  return visibleEntries(section)
    .map(toResearchInterestDisplay)
    .filter((item) => item.title)
})

/** Internal paths route in-app; full URLs open in a new tab. */
function themeLinkAttrs(link: string) {
  if (!link) return {}
  if (link.startsWith('/')) return { to: link }
  return { href: link, target: '_blank', rel: 'noopener noreferrer' }
}

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
    <header class="home-hero">
      <p v-if="roleParts.length" class="home-eyebrow">
        <template v-for="(part, index) in roleParts" :key="part">
          <span v-if="index" aria-hidden="true"> · </span><span class="home-eyebrow__part">{{ part }}</span>
        </template>
      </p>
      <h1 class="home-headline">{{ headline }}</h1>
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
      <ol class="home-themes">
        <li v-for="(theme, index) in researchThemes" :key="theme.title" class="home-theme">
          <span class="home-theme__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="home-theme__title">
            <component
              :is="theme.link ? (theme.link.startsWith('/') ? 'router-link' : 'a') : 'span'"
              v-bind="themeLinkAttrs(theme.link)"
              class="home-theme__link"
            >
              {{ theme.title }}
            </component>
          </h3>
          <p v-if="theme.description" class="home-theme__text">{{ theme.description }}</p>
        </li>
      </ol>
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

.home-hero {
  margin-bottom: 2.25rem;
}

.home-eyebrow {
  margin: 0 0 0.875rem;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-muted);
}

/* Break between parts, not inside them. */
.home-eyebrow__part {
  white-space: nowrap;
}

.home-headline {
  margin: 0;
  max-width: 24ch;
  font-size: clamp(2rem, 1.45rem + 2.1vw, 2.875rem);
  line-height: 1.15;
  color: var(--heading);
  text-wrap: balance;
}

.home-callout {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border-left: 3px solid var(--accent);
  background: var(--tint);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-strong);
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
  color: var(--accent) !important;
  text-underline-offset: 3px;
}

.home-bio p {
  max-width: 68ch;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text-body);
  white-space: pre-line;
  margin-bottom: 1rem;
}

/* The opening paragraph reads as the lede. */
.home-bio p:first-child {
  font-size: 1.1875rem;
  line-height: 1.65;
  color: var(--text-strong);
}

.home-body {
  max-width: 68ch;
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
  font-size: 1.5rem;
  color: var(--heading);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--rule-strong);
}

/* Research themes: one card each, side by side when there's room. */
.home-themes {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}

.home-theme {
  position: relative;
  padding: 1.25rem 1.25rem 1.375rem;
  border: 1px solid var(--rule);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.home-theme:has(.home-theme__link[href]):hover {
  border-color: var(--rule-strong);
  box-shadow: 0 4px 16px rgba(31, 35, 40, 0.06);
}

.home-theme__number {
  display: block;
  margin-bottom: 0.75rem;
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: lining-nums;
}

.home-theme__title {
  margin: 0 0 0.375rem;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.005em;
  color: var(--heading);
}

.home-theme__link {
  color: inherit !important;
  text-decoration: none;
}

/* A linked card is clickable anywhere. */
.home-theme__link[href]::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.home-theme__link[href]:focus-visible {
  outline: none;
}

.home-theme:has(.home-theme__link[href]:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.home-theme__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-body);
}

.home-pub {
  padding: 1.125rem 0;
}

.home-pub + .home-pub {
  border-top: 1px solid var(--rule);
}
</style>
