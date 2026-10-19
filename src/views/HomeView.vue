<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import { useCv } from '@/composables/useCv'
import { useAbout } from '@/composables/useAbout'
import { toResearchInterestDisplay } from '@/utils/cvFormat'
import HomeContent from '@/components/HomeContent.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { publications, load: loadPubs } = usePublications()
const { cv, load: loadCv, visibleEntries } = useCv()
const { about, load: loadAbout } = useAbout()

const researchThemes = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  if (!section) return []
  return visibleEntries(section)
    .map(toResearchInterestDisplay)
    .filter((item) => item.title)
})

onMounted(async () => {
  await Promise.all([loadSettings(), loadPubs(), loadCv(), loadAbout()])
})
</script>

<template>
  <HomeContent
    :settings="settings"
    :bio="about.bio"
    :publications="publications"
    :research-themes="researchThemes"
  />
</template>
