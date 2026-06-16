<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCv } from '@/composables/useCv'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import CvHeader from '@/components/cv/CvHeader.vue'
import CvResearchInterests from '@/components/cv/CvResearchInterests.vue'
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
import { sortEducationEntries, sortExperienceEntries } from '@/utils/cvFormat'

const { cv, load: loadCv, visibleSections, visibleEntries, sectionHasVisibleEntries, loading, error: cvError } =
  useCv()
const { settings, load: loadSettings } = useSiteSettings()
const { load: loadPubs, cvPublicationsByCategory, error: pubsError } = usePublications()
const { cvFilename } = usePdfExport()
const route = useRoute()
const router = useRouter()
const loaded = ref(false)

const pdfName = computed(() => cvFilename(settings.value.name))
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
  | {
      kind: 'simple'
      entries: Record<string, unknown>[]
      title: string
      sectionId: CvSectionId
    }

const renderedSections = computed<RenderedSection[]>(() =>
  publicSections.value
    .map((section) => {
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
  <v-container class="py-12 cv-page">
    <div class="d-flex flex-wrap align-center justify-space-between mb-8 ga-4 cv-page-toolbar">
      <div>
        <h1 class="text-h3 font-weight-bold text-primary mb-1">Curriculum Vitae</h1>
        <p v-if="cv.lastUpdated" class="text-caption text-medium-emphasis">
          Last updated: {{ formatLastUpdated(cv.lastUpdated) }}
        </p>
      </div>
      <CvPdfButton target-id="cv-print-target" :filename="pdfName" />
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <UnderConstruction
      v-if="loaded && !hasContent"
      title="The CV page is under construction"
    />

    <v-card v-else class="pa-8 pa-md-12 cv-document" elevation="2">
      <div id="cv-print-target" class="cv-print-target cv-document-body">
        <CvHeader :settings="settings" />

        <template v-for="(section, index) in renderedSections" :key="index">
          <CvResearchInterests
            v-if="section.kind === 'research'"
            :entries="section.entries"
          />
          <CvCertificates
            v-else-if="section.kind === 'certificates'"
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
          <CvSimpleList
            v-else-if="section.kind === 'simple'"
            :entries="section.entries"
            :title="section.title"
            :section-id="section.sectionId"
          />
        </template>

        <CvPublications
          v-if="publicationGroups.length"
          :intro="cv.publicationsIntro"
          :groups="publicationGroups"
        />
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.cv-document {
  max-width: 850px;
  margin: 0 auto;
}

.cv-print-target {
  font-size: 11pt;
  line-height: 1.45;
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
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    max-width: none !important;
  }

  .cv-print-target {
    padding: 0;
    background: #ffffff;
  }
}
</style>
