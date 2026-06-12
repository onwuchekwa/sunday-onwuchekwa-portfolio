<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePublications } from '@/composables/usePublications'
import PublicationCard from '@/components/PublicationCard.vue'
import type { PublicationType } from '@/types/content'

const { publications, load, loading } = usePublications()
const typeFilter = ref<PublicationType | 'all'>('all')
const yearFilter = ref<number | 'all'>('all')

const years = computed(() =>
  [...new Set(publications.value.map((p) => p.year))].sort((a, b) => b - a),
)

const filtered = computed(() =>
  publications.value.filter((p) => {
    if (typeFilter.value !== 'all' && p.type !== typeFilter.value) return false
    if (yearFilter.value !== 'all' && p.year !== yearFilter.value) return false
    return true
  }),
)

onMounted(load)
</script>

<template>
  <v-container class="py-12">
    <h1 class="text-h3 font-weight-bold text-primary mb-2">Publications</h1>
    <p class="text-body-1 text-medium-emphasis mb-8">
      Research outputs at the intersection of religion, technology, and human-centered design.
    </p>

    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="typeFilter"
          :items="[
            { title: 'All types', value: 'all' },
            { title: 'Paper', value: 'paper' },
            { title: 'Poster', value: 'poster' },
            { title: 'Workshop', value: 'workshop' },
            { title: 'Other', value: 'other' },
          ]"
          label="Filter by type"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="yearFilter"
          :items="[{ title: 'All years', value: 'all' }, ...years.map((y) => ({ title: String(y), value: y }))]"
          label="Filter by year"
        />
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <v-row v-if="filtered.length">
      <v-col v-for="pub in filtered" :key="pub.id" cols="12" md="6">
        <PublicationCard :publication="pub" />
      </v-col>
    </v-row>

    <v-alert v-else-if="!loading" type="info" variant="tonal">
      No publications match the selected filters.
    </v-alert>
  </v-container>
</template>
