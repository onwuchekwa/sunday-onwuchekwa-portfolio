<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useAbout } from '@/composables/useAbout'
import { useCv } from '@/composables/useCv'
import { splitDetailLines, resolveResearchInterestTitle, resolveEducationDisplay, selectAboutEducationEntries } from '@/utils/cvFormat'
import ProfileAvatar from '@/components/ProfileAvatar.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { about, load: loadAbout, error } = useAbout()
const { cv, load: loadCv, visibleEntries, error: cvError } = useCv()
const route = useRoute()
const router = useRouter()
const loaded = ref(false)

function cvSectionEntries(sectionId: string): Record<string, unknown>[] {
  const section = cv.value.sections.find((s) => s.id === sectionId)
  return section ? visibleEntries(section) : []
}

/** Research interests come from the CV (single source); legacy about doc is the fallback. */
const researchInterests = computed<string[]>(() => {
  const fromCv = cvSectionEntries('researchInterests')
    .map((e) => resolveResearchInterestTitle(e))
    .filter(Boolean)
  return fromCv.length ? fromCv : about.value.researchInterests
})

interface EducationDisplay {
  degree: string
  institution: string
  year: string
  detailLines: string[]
}

/** Education comes from the CV (single source); legacy about doc is the fallback. */
const education = computed<EducationDisplay[]>(() => {
  const fromCv = selectAboutEducationEntries(cvSectionEntries('education')).map((e) => {
    const display = resolveEducationDisplay(e)
    return {
      degree: display.degree,
      institution: [display.institution, display.location]
        .map((v) => v.trim())
        .filter(Boolean)
        .join(', '),
      year: display.year,
      detailLines: splitDetailLines(display.details),
    }
  })
  if (fromCv.length) return fromCv
  return about.value.education.map((edu) => ({
    degree: edu.degree,
    institution: edu.institution,
    year: edu.year,
    detailLines: splitDetailLines(edu.details),
  }))
})

const hasContent = computed(
  () =>
    Boolean(about.value.bio?.trim()) ||
    researchInterests.value.length > 0 ||
    education.value.length > 0,
)

watch([error, cvError], ([aboutE, cvE]) => {
  if (aboutE || cvE) {
    router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
  }
})

onMounted(async () => {
  await Promise.all([loadSettings(), loadAbout(), loadCv()])
  loaded.value = true
})
</script>

<template>
  <v-container class="py-12">
    <UnderConstruction v-if="loaded && !hasContent" title="The About page is under construction" />

    <v-row v-else>
      <v-col cols="12" md="4" class="text-center">
        <ProfileAvatar
          :image-url="settings.profileImageUrl"
          :size="240"
          :icon-size="120"
          :show-border="false"
          class="mb-6 elevation-2"
        />
        <h2 class="text-h5 font-weight-bold">{{ settings.name }}</h2>
        <p class="text-body-1 text-medium-emphasis">{{ settings.title }}</p>
      </v-col>

      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold text-primary mb-6">About</h1>

        <div class="text-body-1 mb-8" style="white-space: pre-line; line-height: 1.8">
          {{ about.bio || 'Bio coming soon.' }}
        </div>

        <div v-if="researchInterests.length" class="mb-8">
          <h2 class="text-h5 font-weight-bold mb-4">Research Interests</h2>
          <v-chip
            v-for="interest in researchInterests"
            :key="interest"
            class="ma-1"
            color="secondary"
            variant="tonal"
          >
            {{ interest }}
          </v-chip>
        </div>

        <div v-if="education.length">
          <h2 class="text-h5 font-weight-bold mb-4">Education</h2>
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="(edu, i) in education"
              :key="i"
              dot-color="primary"
              size="small"
            >
              <div class="font-weight-bold">{{ edu.degree }}</div>
              <div class="text-body-2">{{ edu.institution }}</div>
              <div class="text-caption text-medium-emphasis">{{ edu.year }}</div>
              <div
                v-for="(line, lineIndex) in edu.detailLines"
                :key="lineIndex"
                class="text-body-2 mt-1"
              >
                {{ line }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
