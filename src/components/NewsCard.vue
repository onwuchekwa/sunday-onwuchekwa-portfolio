<script setup lang="ts">
import type { NewsItem } from '@/types/content'

defineProps<{ item: NewsItem }>()

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <v-card class="h-100 d-flex flex-column">
    <v-img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      height="180"
      cover
    />
    <v-card-text class="flex-grow-1">
      <div class="text-caption text-medium-emphasis mb-2">
        {{ formatDate(item.date) }}
      </div>
      <h3 class="text-h6 font-weight-bold mb-3">{{ item.title }}</h3>
      <p class="text-body-2 text-truncate-3">
        {{ item.body }}
      </p>
    </v-card-text>
    <v-card-actions>
      <v-btn
        :to="`/news/${item.id}`"
        variant="text"
        color="primary"
        append-icon="mdi-arrow-right"
      >
        Read more
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.text-truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
