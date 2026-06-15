<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNews } from '@/composables/useNews'
import NewsCard from '@/components/NewsCard.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

const { newsItems, load, loading, error } = useNews()
const route = useRoute()
const router = useRouter()

watch(error, (e) => {
  if (e) router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
})

onMounted(() => load(true))
</script>

<template>
  <v-container class="py-12">
    <h1 class="text-h3 font-weight-bold text-primary mb-2">News & Updates</h1>
    <p class="text-body-1 text-medium-emphasis mb-8">
      Talks, paper acceptances, and research milestones.
    </p>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <v-row v-if="newsItems.length">
      <v-col v-for="item in newsItems" :key="item.id" cols="12" md="6" lg="4">
        <NewsCard :item="item" />
      </v-col>
    </v-row>

    <UnderConstruction
      v-else-if="!loading"
      title="The News page is under construction"
    />
  </v-container>
</template>
