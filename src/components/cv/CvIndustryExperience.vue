<script setup lang="ts">
import { computed } from 'vue'
import { formatExperienceDates } from '@/utils/cvFormat'
import { groupByInstitution } from '@/utils/cvGroups'
import CvGroupedSection from '@/components/cv/CvGroupedSection.vue'

const props = defineProps<{
  entries: Record<string, unknown>[]
  title?: string
}>()

/** Roles nested under their organisation. */
const groups = computed(() =>
  groupByInstitution(
    props.entries.map((entry) => ({
      name: String(entry.company ?? ''),
      location: String(entry.location ?? ''),
      item: {
        title: String(entry.role ?? ''),
        date: formatExperienceDates(String(entry.dates ?? '')),
        details: entry.details,
      },
    })),
  ),
)
</script>

<template>
  <CvGroupedSection :title="title ?? 'Industry Experience'" :groups="groups" />
</template>
