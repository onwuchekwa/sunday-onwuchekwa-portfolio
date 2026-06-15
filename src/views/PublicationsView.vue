<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import PublicationCard from '@/components/PublicationCard.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

const { load, loading, error, publicationsByCategory } = usePublications()
const groups = computed(() => publicationsByCategory())
const route = useRoute()
const router = useRouter()

watch(error, (e) => {
  if (e) router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
})

onMounted(load)
</script>

<template>
  <v-container class="py-12">
    <h1 class="text-h3 font-weight-bold text-primary mb-2">Papers &amp; Publications</h1>
    <p class="text-body-1 text-medium-emphasis mb-10">
      Research outputs at the intersection of religion, technology, and human-centered design.
    </p>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <template v-else>
      <section
        v-for="group in groups"
        :key="group.category"
        class="pub-category-section mb-12"
      >
        <h2 class="text-h5 font-weight-bold text-primary mb-6 pub-category-title">
          {{ group.title }}
        </h2>

        <div class="d-flex flex-column ga-6">
          <PublicationCard
            v-for="pub in group.publications"
            :key="pub.id"
            :publication="pub"
          />
        </div>
      </section>

      <UnderConstruction
        v-if="!groups.length"
        title="The Publications page is under construction"
      />
    </template>
  </v-container>
</template>

<style scoped>
.pub-category-title {
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2);
  padding-bottom: 0.5rem;
}

.pub-category-section:last-child {
  margin-bottom: 0;
}
</style>
