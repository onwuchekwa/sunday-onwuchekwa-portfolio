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
  variant?: 'education' | 'experience' | 'twoRow'
  institution?: string
  location?: string
  degree?: string
  year?: string
  primary?: string
  secondary?: string
  dates?: string
  details?: unknown
  line1?: CvEntryRow
  line2?: CvEntryRow
}>()

const bulletLines = computed(() => splitDetailLines(props.details))

const rows = computed((): CvEntryRow[] => {
  if (props.variant === 'education') {
    return [
      {
        left: props.institution,
        right: props.location,
        rightItalic: Boolean(props.location),
      },
      {
        left: props.degree,
        right: props.year,
        leftBold: true,
      },
    ]
  }

  if (props.variant === 'experience') {
    const hasSecondRow = Boolean(props.secondary || props.location)
    return [
      { left: props.primary, right: props.dates, leftBold: true },
      ...(hasSecondRow
        ? [
            {
              left: props.secondary,
              right: props.location,
              leftItalic: Boolean(props.secondary),
              rightItalic: Boolean(props.location),
            },
          ]
        : []),
    ]
  }

  if (props.variant === 'twoRow') {
    return [props.line1, props.line2].filter((row): row is CvEntryRow => Boolean(row?.left || row?.right))
  }

  return []
})

function rowLeftClass(row: CvEntryRow): string {
  return [
    'cv-row-left',
    row.leftBold ? 'cv-row-left--bold' : '',
    row.leftItalic ? 'cv-row-left--italic' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function rowRightClass(row: CvEntryRow): string {
  return ['cv-row-right', row.rightItalic ? 'cv-row-right--italic' : ''].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="cv-entry">
    <div v-for="(row, index) in rows" :key="index" class="cv-row">
      <span v-if="row.left" :class="rowLeftClass(row)">{{ row.left }}</span>
      <span v-if="row.right" :class="rowRightClass(row)">{{ row.right }}</span>
    </div>
    <ul v-if="bulletLines.length" class="cv-bullet-list">
      <li v-for="(line, lineIndex) in bulletLines" :key="lineIndex">
        {{ line.replace(/^[●\-•]\s*/, '') }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
@import './cv-section.css';
</style>
