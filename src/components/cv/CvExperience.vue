<script setup lang="ts">
import { computed } from 'vue'
import { resolveExperienceDisplay } from '@/utils/cvFormat'
import { groupByInstitution } from '@/utils/cvGroups'
import CvGroupedSection from '@/components/cv/CvGroupedSection.vue'

const props = defineProps<{
  entries: Record<string, unknown>[]
  title?: string
  educationEntries?: Record<string, unknown>[]
}>()

/** Roles nested under their institution. */
const groups = computed(() =>
  groupByInstitution(
    props.entries.map((entry) => {
      const display = resolveExperienceDisplay(entry, { educationEntries: props.educationEntries })
      return {
        name: display.secondary,
        location: display.location,
        item: { title: display.primary, date: display.dates, details: display.details },
      }
    }),
  ),
)
</script>

<template>
  <CvGroupedSection :title="title ?? 'Academic Experience'" :groups="groups" />
</template>
