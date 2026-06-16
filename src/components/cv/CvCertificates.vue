<script setup lang="ts">
import { formatCertificates } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'

defineProps<{
  entries: Record<string, unknown>[]
}>()
</script>

<template>
  <section v-if="entries.length" class="cv-section cv-certificates">
    <CvSectionHeading title="Certificates" />
    <p class="cv-paragraph">{{ formatCertificates(entries) }}</p>
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
