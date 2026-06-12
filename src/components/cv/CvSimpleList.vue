<script setup lang="ts">
import { computed } from 'vue'
import type { CvEntryRow } from '@/components/cv/CvEntryBlock.vue'
import type { CvSectionId } from '@/types/cv'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'
import CvEntryBlock from '@/components/cv/CvEntryBlock.vue'

const props = defineProps<{
  entries: Record<string, unknown>[]
  title: string
  sectionId: CvSectionId
}>()

function entryRows(entry: Record<string, unknown>): {
  line1: CvEntryRow
  line2?: CvEntryRow
  details?: unknown
} {
  switch (props.sectionId) {
    case 'awards':
      return {
        line1: {
          left: String(entry.title ?? ''),
          right: String(entry.year ?? ''),
          leftBold: true,
        },
        line2: {
          left: String(entry.issuer ?? ''),
          leftItalic: true,
        },
      }
    case 'service':
      return {
        line1: {
          left: String(entry.role ?? ''),
          right: String(entry.dates ?? ''),
          leftBold: true,
        },
        line2: {
          left: String(entry.organization ?? ''),
          leftItalic: true,
        },
      }
    case 'invitedEvents':
      return {
        line1: {
          left: String(entry.title ?? ''),
          right: String(entry.date ?? ''),
          leftBold: true,
        },
        line2: {
          left: String(entry.venue ?? ''),
          leftItalic: true,
        },
        details: entry.details,
      }
    case 'presentations': {
      const venueType = [entry.venue, entry.type].filter(Boolean).join(' · ')
      return {
        line1: {
          left: String(entry.title ?? ''),
          right: String(entry.date ?? ''),
          leftBold: true,
        },
        line2: venueType
          ? {
              left: venueType,
              leftItalic: true,
            }
          : undefined,
      }
    }
    case 'grants': {
      const funderAmount = [entry.funder, entry.amount].filter(Boolean).join(' · ')
      return {
        line1: {
          left: String(entry.title ?? ''),
          right: String(entry.dates ?? ''),
          leftBold: true,
        },
        line2: funderAmount
          ? {
              left: funderAmount,
              leftItalic: true,
            }
          : undefined,
      }
    }
    case 'skills':
      return {
        line1: {
          left: String(entry.category ?? ''),
          leftBold: true,
        },
        line2: {
          left: String(entry.items ?? ''),
        },
      }
    default:
      return {
        line1: {
          left: Object.entries(entry)
            .filter(([key]) => key !== 'visible')
            .map(([, value]) => value)
            .filter(Boolean)
            .join(' · '),
        },
      }
  }
}

const renderedEntries = computed(() =>
  props.entries.map((entry) => ({ entry, rows: entryRows(entry) })),
)
</script>

<template>
  <section v-if="entries.length" class="cv-section">
    <CvSectionHeading :title="title" />
    <CvEntryBlock
      v-for="(item, index) in renderedEntries"
      :key="index"
      variant="twoRow"
      :line1="item.rows.line1"
      :line2="item.rows.line2"
      :details="item.rows.details"
    />
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
