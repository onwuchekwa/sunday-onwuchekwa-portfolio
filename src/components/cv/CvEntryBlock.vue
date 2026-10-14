<script setup lang="ts">
import { computed } from 'vue'
import { splitDetailLines } from '@/utils/cvFormat'

export interface CvEntryRow {
  left?: string
  right?: string
  leftBold?: boolean
  leftItalic?: boolean
  rightItalic?: boolean
}

const props = defineProps<{
  line1?: CvEntryRow
  line2?: CvEntryRow
  details?: unknown
}>()

const bulletLines = computed(() =>
  splitDetailLines(props.details).map((line) => line.replace(/^[●\-•◦]\s*/, '')),
)

/** "• Title … date" then an italic description line, as in classic academic CVs. */
const rows = computed(() =>
  [props.line1, props.line2].filter((row): row is CvEntryRow => Boolean(row?.left || row?.right)),
)
</script>

<template>
  <div class="cv-entry cv-entry--bulleted">
    <div v-for="(row, index) in rows" :key="index" class="cv-row" :class="{ 'cv-row--sub': index > 0 }">
      <span
        class="cv-row__left"
        :class="{ 'cv-row__left--bold': row.leftBold, 'cv-row__left--italic': row.leftItalic }"
      >
        {{ row.left }}
      </span>
      <span v-if="row.right" class="cv-row__right cv-row__right--italic">{{ row.right }}</span>
    </div>
    <ul v-if="bulletLines.length" class="cv-bullet-list cv-bullet-list--hollow">
      <li v-for="(line, lineIndex) in bulletLines" :key="lineIndex">{{ line }}</li>
    </ul>
  </div>
</template>

<style scoped>
@import './cv-section.css';
</style>
