<script setup lang="ts">
import type { Publication } from '@/types/content'

defineProps<{ publication: Publication }>()

const typeColors: Record<string, string> = {
  paper: 'primary',
  poster: 'secondary',
  workshop: 'accent',
  other: 'grey',
}
</script>

<template>
  <v-card class="pa-5 h-100">
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-chip :color="typeColors[publication.type] ?? 'grey'" size="small" label>
        {{ publication.type }}
      </v-chip>
      <v-chip size="small" variant="outlined">{{ publication.year }}</v-chip>
      <v-chip v-if="publication.featured" color="accent" size="small" variant="flat">
        Featured
      </v-chip>
    </div>

    <h3 class="text-h6 font-weight-bold mb-2">{{ publication.title }}</h3>
    <p class="text-body-2 text-medium-emphasis mb-1">{{ publication.authors }}</p>
    <p class="text-body-2 font-italic mb-3">{{ publication.venue }}</p>

    <p v-if="publication.abstract" class="text-body-2 mb-4">
      {{ publication.abstract }}
    </p>

    <div class="d-flex flex-wrap ga-2">
      <v-btn
        v-if="publication.links.pdf"
        :href="publication.links.pdf"
        target="_blank"
        size="small"
        variant="tonal"
        prepend-icon="mdi-file-pdf-box"
      >
        PDF
      </v-btn>
      <v-btn
        v-if="publication.links.doi"
        :href="publication.links.doi"
        target="_blank"
        size="small"
        variant="tonal"
        prepend-icon="mdi-link-variant"
      >
        DOI
      </v-btn>
      <v-btn
        v-if="publication.links.arxiv"
        :href="publication.links.arxiv"
        target="_blank"
        size="small"
        variant="tonal"
        prepend-icon="mdi-link-variant"
      >
        arXiv
      </v-btn>
    </div>
  </v-card>
</template>
