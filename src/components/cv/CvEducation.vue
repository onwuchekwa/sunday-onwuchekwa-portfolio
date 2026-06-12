<script setup lang="ts">
import { resolveEducationDisplay } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'
import CvEntryBlock from '@/components/cv/CvEntryBlock.vue'

defineProps<{
  entries: Record<string, unknown>[]
}>()
</script>

<template>
  <section v-if="entries.length" class="cv-section">
    <CvSectionHeading title="Education" />
    <CvEntryBlock
      v-for="(entry, index) in entries"
      :key="index"
      variant="education"
      v-bind="resolveEducationDisplay(entry)"
    />
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
