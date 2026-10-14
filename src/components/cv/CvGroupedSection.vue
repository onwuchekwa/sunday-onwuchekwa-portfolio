<script setup lang="ts">
import { splitDetailLines } from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'

export interface CvGroupItem {
  title: string
  date: string
  details?: unknown
}

export interface CvGroup {
  name: string
  location: string
  items: CvGroupItem[]
}

defineProps<{
  title: string
  groups: CvGroup[]
  /** Bold item titles (degrees); experience roles stay regular weight */
  boldItems?: boolean
  /** Italic notes (dissertation, committee, GPA) as under degrees */
  italicNotes?: boolean
}>()

function notes(details: unknown): string[] {
  return splitDetailLines(details).map((line) => line.replace(/^[●\-•◦]\s*/, ''))
}
</script>

<template>
  <section v-if="groups.length" class="cv-section">
    <CvSectionHeading :title="title" />
    <div v-for="(group, groupIndex) in groups" :key="groupIndex" class="cv-institution">
      <div class="cv-row">
        <span class="cv-institution__name">{{ group.name }}</span>
        <span v-if="group.location" class="cv-row__right cv-row__right--italic">{{ group.location }}</span>
      </div>
      <div class="cv-institution__degrees">
        <div v-for="(item, itemIndex) in group.items" :key="itemIndex" class="cv-entry">
          <div class="cv-row">
            <span class="cv-row__left" :class="{ 'cv-row__left--bold': boldItems }">{{ item.title }}</span>
            <span v-if="item.date" class="cv-row__right cv-row__right--italic">{{ item.date }}</span>
          </div>
          <ul v-if="notes(item.details).length" class="cv-bullet-list cv-bullet-list--hollow" :class="{ 'cv-bullet-list--italic': italicNotes }">
            <li v-for="(line, lineIndex) in notes(item.details)" :key="lineIndex">{{ line }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
