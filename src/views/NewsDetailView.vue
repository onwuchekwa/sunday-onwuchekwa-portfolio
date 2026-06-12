<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNews } from '@/composables/useNews'

const route = useRoute()
const { newsItems, load, loading } = useNews()

const item = computed(() => newsItems.value.find((n) => n.id === route.params.id))

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => load(true))
</script>

<template>
  <v-container class="py-12">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <template v-else-if="item">
      <v-btn to="/news" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">
        Back to news
      </v-btn>

      <v-img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        max-height="400"
        cover
        class="rounded-lg mb-6"
      />

      <p class="text-caption text-medium-emphasis mb-2">{{ formatDate(item.date) }}</p>
      <h1 class="text-h3 font-weight-bold text-primary mb-6">{{ item.title }}</h1>
      <div class="text-body-1" style="white-space: pre-line; line-height: 1.8">
        {{ item.body }}
      </div>
    </template>

    <v-alert v-else type="warning" variant="tonal">
      News post not found.
    </v-alert>
  </v-container>
</template>
