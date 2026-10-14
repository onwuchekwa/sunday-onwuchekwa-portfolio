<script setup lang="ts">
import { computed } from 'vue'
import { resolveEducationDisplay } from '@/utils/cvFormat'
import { groupByInstitution } from '@/utils/cvGroups'
import CvGroupedSection from '@/components/cv/CvGroupedSection.vue'

const props = defineProps<{
  entries: Record<string, unknown>[]
}>()

/** Degrees nested under their institution. */
const groups = computed(() =>
  groupByInstitution(
    props.entries.map((entry) => {
      const display = resolveEducationDisplay(entry)
      return {
        name: display.institution,
        location: display.location,
        item: { title: display.degree, date: display.year, details: display.details },
      }
    }),
  ),
)
</script>

<template>
  <CvGroupedSection title="Education" :groups="groups" bold-items italic-notes />
</template>
