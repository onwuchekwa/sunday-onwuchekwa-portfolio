<script setup lang="ts">
import { formatExperienceDates } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'
import CvEntryBlock from '@/components/cv/CvEntryBlock.vue'

defineProps<{
  entries: Record<string, unknown>[]
  title?: string
}>()
</script>

<template>
  <section v-if="entries.length" class="cv-section">
    <CvSectionHeading :title="title ?? 'Industry Experience'" />
    <CvEntryBlock
      v-for="(entry, index) in entries"
      :key="index"
      variant="experience"
      :primary="String(entry.role ?? '')"
      :secondary="String(entry.company ?? '')"
      :dates="formatExperienceDates(String(entry.dates ?? ''))"
      :location="String(entry.location ?? '')"
      :details="entry.details"
    />
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
