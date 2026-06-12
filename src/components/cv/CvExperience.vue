<script setup lang="ts">
import { computed } from 'vue'
import { resolveExperienceDisplay } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'
import CvEntryBlock from '@/components/cv/CvEntryBlock.vue'

const props = defineProps<{
  entries: Record<string, unknown>[]
  title?: string
  educationEntries?: Record<string, unknown>[]
}>()

const displayEntries = computed(() =>
  props.entries.map((entry) =>
    resolveExperienceDisplay(entry, { educationEntries: props.educationEntries }),
  ),
)
</script>

<template>
  <section v-if="entries.length" class="cv-section">
    <CvSectionHeading :title="title ?? 'Academic Experience'" />
    <CvEntryBlock
      v-for="(display, index) in displayEntries"
      :key="index"
      variant="experience"
      :primary="display.primary"
      :secondary="display.secondary"
      :dates="display.dates"
      :location="display.location"
      :details="display.details"
    />
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
