<script setup lang="ts">
import type { CvSection } from '@/types/cv'
import type { Publication } from '@/types/content'

defineProps<{
  section: CvSection
  publications?: Publication[]
}>()

function formatEntry(entry: Record<string, unknown>, sectionId: string): string {
  switch (sectionId) {
    case 'education':
      return [entry.degree, entry.institution, entry.year].filter(Boolean).join(' — ')
    case 'researchInterests':
      return String(entry.text ?? '')
    case 'appointments':
      return [entry.role, entry.institution, entry.dates].filter(Boolean).join(' · ')
    case 'presentations':
      return [entry.title, entry.venue, entry.date].filter(Boolean).join(' · ')
    case 'grants':
      return [entry.title, entry.funder, entry.dates].filter(Boolean).join(' · ')
    case 'teaching':
      return [entry.role, entry.course, entry.institution, entry.term].filter(Boolean).join(' · ')
    case 'service':
      return [entry.role, entry.organization, entry.dates].filter(Boolean).join(' · ')
    case 'awards':
      return [entry.title, entry.issuer, entry.year].filter(Boolean).join(' · ')
    case 'skills': {
      const items = String(entry.items ?? '')
      return `${entry.category}: ${items}`
    }
    default:
      return Object.values(entry).filter(Boolean).join(' · ')
  }
}

function formatPublication(pub: Publication): string {
  return `${pub.authors}. "${pub.title}." ${pub.venue}, ${pub.year}.`
}
</script>

<template>
  <section class="cv-section mb-5">
    <h2 class="cv-section-title text-uppercase">{{ section.title }}</h2>
    <v-divider class="mb-3 border-opacity-50" color="primary" />

    <ul v-if="section.id !== 'publications'" class="cv-entry-list">
      <li v-for="(entry, index) in section.entries" :key="index" class="cv-entry">
        <div class="cv-entry-main">{{ formatEntry(entry, section.id) }}</div>
        <div v-if="entry.details" class="cv-entry-details">{{ entry.details }}</div>
      </li>
    </ul>

    <ul v-else-if="publications?.length" class="cv-entry-list">
      <li v-for="pub in publications" :key="pub.id" class="cv-entry">
        {{ formatPublication(pub) }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cv-section-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgb(var(--v-theme-primary));
}

.cv-entry-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cv-entry {
  margin-bottom: 0.5rem;
  font-size: 0.92rem;
  line-height: 1.5;
}

.cv-entry-details {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 0.15rem;
}
</style>
