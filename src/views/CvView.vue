<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCv } from '@/composables/useCv'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import CvHeader from '@/components/cv/CvHeader.vue'
import CvCertificates from '@/components/cv/CvCertificates.vue'
import CvEducation from '@/components/cv/CvEducation.vue'
import CvExperience from '@/components/cv/CvExperience.vue'
import CvIndustryExperience from '@/components/cv/CvIndustryExperience.vue'
import CvSimpleList from '@/components/cv/CvSimpleList.vue'
import CvPublications from '@/components/cv/CvPublications.vue'
import CvPdfButton from '@/components/cv/CvPdfButton.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'
import { usePdfExport } from '@/composables/usePdfExport'
import type { CvSectionId } from '@/types/cv'
import { isEntryVisible } from '@/types/cv'
import { resolveResearchInterestTitle, sortEducationEntries, sortExperienceEntries } from '@/utils/cvFormat'

const { cv, load: loadCv, visibleSections, visibleEntries, sectionHasVisibleEntries, loading, error: cvError } =
  useCv()
const { settings, load: loadSettings } = useSiteSettings()
const { load: loadPubs, cvPublicationsByCategory, error: pubsError } = usePublications()
const { cvFilename } = usePdfExport()
const route = useRoute()
const router = useRouter()
const loaded = ref(false)

const pdfName = computed(() => cvFilename(settings.value.name))
/** Running footer on every printed page, as US academic CVs usually have. */
const pdfFooter = computed(() => {
  const updated = cv.value.lastUpdated
    ? new Date(cv.value.lastUpdated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  return [`${settings.value.name} · Curriculum Vitae`, updated && `Updated ${updated}`]
    .filter(Boolean)
    .join(' · ')
})
const publicationGroups = computed(() => cvPublicationsByCategory())

const educationEntries = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'education')
  return section?.entries.filter(isEntryVisible) ?? []
})

const publicSections = computed(() =>
  visibleSections().filter((section) => sectionHasVisibleEntries(section)),
)

type RenderedSection =
  | { kind: 'research'; entries: Record<string, unknown>[] }
  | { kind: 'certificates'; entries: Record<string, unknown>[] }
  | { kind: 'education'; entries: Record<string, unknown>[] }
  | { kind: 'experience'; entries: Record<string, unknown>[]; title: string }
  | { kind: 'industry'; entries: Record<string, unknown>[]; title: string }
  | { kind: 'publications' }
  | {
      kind: 'simple'
      entries: Record<string, unknown>[]
      title: string
      sectionId: CvSectionId
    }

const renderedSections = computed<RenderedSection[]>(() =>
  publicSections.value
    .map((section): RenderedSection | null => {
      const entries = visibleEntries(section)
      switch (section.id as CvSectionId) {
        case 'researchInterests':
          return { kind: 'research' as const, entries }
        case 'certificates':
          return { kind: 'certificates' as const, entries }
        case 'education':
          return { kind: 'education' as const, entries: sortEducationEntries(entries) }
        case 'appointments':
          return { kind: 'experience' as const, entries: sortExperienceEntries(entries), title: section.title }
        case 'industryExperience':
        case 'volunteerExperience':
          return { kind: 'industry' as const, entries: sortExperienceEntries(entries), title: section.title }
        case 'awards':
        case 'service':
        case 'invitedEvents':
        case 'presentations':
        case 'grants':
        case 'skills':
          return {
            kind: 'simple' as const,
            entries,
            title: section.title,
            sectionId: section.id as CvSectionId,
          }
        default:
          return null
      }
    })
    .filter((section): section is RenderedSection => section !== null),
)

/** Research interests appear as a keyword line in the header (classic academic CV style). */
const researchKeywords = computed(() => {
  const section = renderedSections.value.find((s) => s.kind === 'research')
  return section && 'entries' in section
    ? section.entries.map(resolveResearchInterestTitle).filter(Boolean)
    : []
})

/** US academic CVs put publications high: right after Education. */
const orderedSections = computed<RenderedSection[]>(() => {
  const sections = renderedSections.value.filter((s) => s.kind !== 'research')
  if (!publicationGroups.value.length) return sections
  const anchor = sections.findIndex((s) => s.kind === 'education')
  sections.splice(anchor + 1, 0, { kind: 'publications' })
  return sections
})

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const hasContent = computed(
  () => renderedSections.value.length > 0 || publicationGroups.value.length > 0,
)

watch([cvError, pubsError], ([cvE, pubE]) => {
  if (cvE || pubE) {
    router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
  }
})

onMounted(async () => {
  await Promise.all([loadCv(), loadSettings(), loadPubs()])
  loaded.value = true
})
</script>

<template>
  <v-container class="py-8 py-md-12 cv-page">
    <div class="cv-page-toolbar">
      <div>
        <h1 class="text-h3 font-weight-bold text-primary mb-1">Curriculum Vitae</h1>
        <p v-if="cv.lastUpdated" class="text-caption text-body-readable mb-0">
          Last updated {{ formatLastUpdated(cv.lastUpdated) }}
        </p>
      </div>
      <CvPdfButton :filename="pdfName" :footer-label="pdfFooter" />
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <UnderConstruction
      v-if="loaded && !hasContent"
      title="The CV page is under construction"
    />

    <article v-else class="cv-document">
      <div id="cv-print-target" class="cv-print-target">
        <CvHeader :settings="settings" :keywords="researchKeywords" />

        <template v-for="(section, index) in orderedSections" :key="index">
          <CvCertificates
            v-if="section.kind === 'certificates'"
            :entries="section.entries"
          />
          <CvEducation
            v-else-if="section.kind === 'education'"
            :entries="section.entries"
          />
          <CvExperience
            v-else-if="section.kind === 'experience'"
            :entries="section.entries"
            :title="section.title"
            :education-entries="educationEntries"
          />
          <CvIndustryExperience
            v-else-if="section.kind === 'industry'"
            :entries="section.entries"
            :title="section.title"
          />
          <CvPublications
            v-else-if="section.kind === 'publications'"
            :groups="publicationGroups"
          />
          <CvSimpleList
            v-else-if="section.kind === 'simple'"
            :entries="section.entries"
            :title="section.title"
            :section-id="section.sectionId"
          />
        </template>

      </div>
    </article>
  </v-container>
</template>

<style scoped>
.cv-page-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  max-width: 8.5in;
  margin: 0 auto 1.5rem;
}

/* On screen the CV sits on a letter-width sheet of paper. */
.cv-document {
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.75in 0.7in;
  background: #ffffff;
  border: 1px solid rgba(0, 46, 93, 0.1);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 46, 93, 0.04), 0 8px 24px rgba(0, 46, 93, 0.06);
}

@media (max-width: 599.98px) {
  .cv-document {
    padding: 1.5rem 1.125rem;
  }
}

.cv-print-target {
  --cv-navy: #002e5d;
  --cv-link: #0047ba;
  --cv-ink: #1f2933;
  --cv-ink-strong: #111827;
  --cv-muted: #3e4c59;
  /* Palatino-style serif, the classic LaTeX academic CV face; Lora when Palatino is absent. */
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, 'TeX Gyre Pagella', Lora, Georgia, serif;
  font-size: 11pt;
  line-height: 1.45;
  color: var(--cv-ink);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@media print {
  .cv-page-toolbar,
  .cv-page :deep(.v-progress-linear) {
    display: none !important;
  }

  .cv-page {
    padding: 0 !important;
    max-width: none !important;
  }

  .cv-document {
    max-width: none;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>

<style>
/* Print the CV page as a clean US-letter document with real (selectable) text. */
@page {
  size: letter;
  margin: 1in;

  @bottom-right {
    content: counter(page) ' of ' counter(pages);
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
    font-size: 8.5pt;
    color: #52606d;
  }
}

@media print {
  html,
  body,
  .v-application,
  .v-main {
    background: #ffffff !important;
  }

  .app-header,
  .app-footer,
  .public-shell__aside {
    display: none !important;
  }

  .v-main {
    padding: 0 !important;
  }
}
</style>
