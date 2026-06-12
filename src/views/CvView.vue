<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCv } from '@/composables/useCv'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import CvSection from '@/components/cv/CvSection.vue'
import CvPdfButton from '@/components/cv/CvPdfButton.vue'
import { usePdfExport } from '@/composables/usePdfExport'
import type { CvSection as CvSectionType } from '@/types/cv'

const { cv, load: loadCv, visibleSections, loading } = useCv()
const { settings, load: loadSettings } = useSiteSettings()
const { load: loadPubs, cvPublications } = usePublications()
const { cvFilename } = usePdfExport()

const pdfName = computed(() => cvFilename(settings.value.name))

const sectionsWithPubs = computed(() => {
  const pubs = cvPublications()
  const sections = visibleSections()
  const result: CvSectionType[] = []

  for (const section of sections) {
    result.push(section)
  }

  if (pubs.length) {
    result.push({
      id: 'publications',
      title: 'Publications',
      visible: true,
      order: 100,
      entries: [],
    })
    result.sort((a, b) => a.order - b.order)
  }

  return result
})

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  await Promise.all([loadCv(), loadSettings(), loadPubs()])
})
</script>

<template>
  <v-container class="py-12">
    <div class="d-flex flex-wrap align-center justify-space-between mb-8 ga-4">
      <div>
        <h1 class="text-h3 font-weight-bold text-primary mb-1">Curriculum Vitae</h1>
        <p v-if="cv.lastUpdated" class="text-caption text-medium-emphasis">
          Last updated: {{ formatLastUpdated(cv.lastUpdated) }}
        </p>
      </div>
      <CvPdfButton target-id="cv-print-target" :filename="pdfName" />
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <v-card class="pa-8 pa-md-12 cv-document" elevation="2">
      <div id="cv-print-target" class="cv-print-target">
        <header class="cv-header text-center mb-8">
          <h1 class="cv-name">{{ settings.name }}</h1>
          <p class="cv-title">{{ settings.title }}</p>
          <p class="cv-contact">
            <a :href="`mailto:${settings.email}`">{{ settings.email }}</a>
            <template v-for="link in settings.socialLinks" :key="link.url">
              &nbsp;·&nbsp;
              <a :href="link.url" target="_blank" rel="noopener">{{ link.platform }}</a>
            </template>
          </p>
        </header>

        <CvSection
          v-for="section in sectionsWithPubs"
          :key="section.id"
          :section="section"
          :publications="section.id === 'publications' ? cvPublications() : undefined"
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

.cv-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 0.25rem;
}

.cv-title {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 0.5rem;
}

.cv-contact {
  font-size: 0.85rem;
}

.cv-contact a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

@media print {
  .cv-print-target {
    padding: 0;
  }
}
</style>
