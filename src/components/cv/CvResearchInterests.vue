<script setup lang="ts">
import { formatResearchInterests } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'

defineProps<{
  entries: Record<string, unknown>[]
}>()
</script>

<template>
  <section v-if="entries.length" class="cv-section cv-research-interests">
    <CvSectionHeading title="Research Interests" />
    <p class="cv-paragraph">{{ formatResearchInterests(entries) }}</p>
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
