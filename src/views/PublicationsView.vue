<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { groupPublications, type PublicationGrouping } from '@/utils/publicationGroups'
import PublicationCard from '@/components/PublicationCard.vue'
import UnderConstruction from '@/components/UnderConstruction.vue'

const { publications, load, loading, error } = usePublications()
const { settings, load: loadSettings } = useSiteSettings()
const route = useRoute()
const router = useRouter()

/** Grouping lives in the URL (?view=type) so a view can be linked to directly. */
const grouping = computed<PublicationGrouping>({
  get: () => (route.query.view === 'type' ? 'type' : 'year'),
  set: (value) => {
    router.replace({ query: { ...route.query, view: value === 'type' ? 'type' : undefined } })
  },
})

const groups = computed(() => groupPublications(publications.value, grouping.value))

const scholarUrl = computed(
  () =>
    settings.value.socialLinks.find((link) => /scholar/i.test(link.platform) && link.url)?.url ??
    '',
)

watch(error, (e) => {
  if (e) router.replace({ name: 'error', query: { code: '503', from: route.fullPath } })
})

onMounted(() => Promise.all([load(), loadSettings()]))
</script>

<template>
  <v-container class="pub-page py-10 py-md-12">
    <header class="mb-8">
      <h1 class="text-h3 font-weight-bold text-primary mb-2">Publications</h1>
      <p class="text-body-1 text-body-readable mb-0">
        Research at the intersection of religion, technology, and human-centered design.
        <template v-if="scholarUrl">
          See my
          <a :href="scholarUrl" target="_blank" rel="noopener noreferrer" class="pub-page-link">Google Scholar</a>
          for citations.
        </template>
      </p>
    </header>

    <v-btn-toggle
      v-model="grouping"
      mandatory
      divided
      density="comfortable"
      color="primary"
      variant="outlined"
      class="mb-8"
      aria-label="Group publications"
    >
      <v-btn value="year" prepend-icon="mdi-calendar-blank-outline">By Year</v-btn>
      <v-btn value="type" prepend-icon="mdi-shape-outline">By Type</v-btn>
    </v-btn-toggle>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-6" />

    <template v-else>
      <section v-for="group in groups" :key="group.id" class="pub-group" :aria-labelledby="group.id">
        <h2 :id="group.id" class="pub-group-title">
          {{ group.title }}
          <span class="pub-group-count">{{ group.publications.length }}</span>
        </h2>

        <PublicationCard
          v-for="pub in group.publications"
          :key="pub.id"
          :publication="pub"
          class="pub-group-item"
        />
      </section>

      <UnderConstruction
        v-if="!groups.length"
        title="The Publications page is under construction"
      />
    </template>
  </v-container>
</template>

<style scoped>
.pub-page {
  max-width: 920px;
}

.pub-page-link {
  color: var(--byu-royal) !important;
  font-weight: 500;
  text-underline-offset: 3px;
}

.pub-group {
  margin-bottom: 2.75rem;
}

.pub-group-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--byu-navy);
  padding-bottom: 0.5rem;
  margin-bottom: 0.25rem;
  border-bottom: 2px solid var(--byu-light-blue);
}

.pub-group-count {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-body);
  opacity: 0.75;
}

.pub-group-item {
  padding: 1.25rem 0;
}

.pub-group-item + .pub-group-item {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}

:deep(.v-btn-toggle .v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
</style>
