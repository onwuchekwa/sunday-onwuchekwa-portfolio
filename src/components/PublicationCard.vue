<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PUBLICATION_LINK_FIELDS,
  publicationTypeLabel,
  resolvePublicationStatus,
  resolveVenueShort,
  type Publication,
} from '@/types/content'
import AuthorList from '@/components/AuthorList.vue'

const props = defineProps<{
  publication: Publication
  showAbstract?: boolean
}>()

const abstractOpen = ref(false)

const primaryLink = computed(() => {
  const { links, sourceUrl } = props.publication
  return sourceUrl || links.doi || links.pdf || links.arxiv || null
})

const venueBadge = computed(() => resolveVenueShort(props.publication))
const typeLabel = computed(() => publicationTypeLabel(props.publication.type))
const status = computed(() => resolvePublicationStatus(props.publication))

const links = computed(() =>
  PUBLICATION_LINK_FIELDS.map((field) => ({ ...field, url: props.publication.links?.[field.key] }))
    .filter((link) => link.url)
    .concat(
      props.publication.sourceUrl && props.publication.sourceUrl !== primaryLink.value
        ? [{ key: 'pdf', label: 'Source', icon: 'mdi-open-in-new', url: props.publication.sourceUrl }]
        : [],
    ),
)

const canShowAbstract = computed(() => props.showAbstract !== false && !!props.publication.abstract)
</script>

<template>
  <article class="pub-entry d-flex ga-4">
    <div class="pub-main flex-grow-1">
      <div class="pub-meta d-flex flex-wrap align-center ga-2 mb-1">
        <span v-if="status === 'under_review'" class="pub-badge pub-badge--review">Under Review</span>
        <span v-else-if="venueBadge" class="pub-badge">{{ venueBadge }}</span>
        <span class="pub-type">{{ typeLabel }}</span>
        <span v-if="status === 'accepted'" class="pub-type pub-type--status">· Accepted</span>
      </div>

      <h3 class="pub-title">
        <a
          v-if="primaryLink"
          :href="primaryLink"
          target="_blank"
          rel="noopener noreferrer"
          class="pub-title-link"
        >
          {{ publication.title }}
        </a>
        <span v-else>{{ publication.title }}</span>
      </h3>

      <p class="pub-authors">
        <AuthorList :authors="publication.authors" />
      </p>
      <p v-if="publication.venue" class="pub-venue">
        {{ publication.venue }}<template v-if="status !== 'under_review'">, {{ publication.year }}</template>
      </p>

      <div v-if="links.length || canShowAbstract" class="pub-links d-flex flex-wrap ga-2 mt-2">
        <v-btn
          v-if="canShowAbstract"
          size="small"
          variant="outlined"
          color="primary"
          :prepend-icon="abstractOpen ? 'mdi-chevron-up' : 'mdi-text-short'"
          :aria-expanded="abstractOpen"
          @click="abstractOpen = !abstractOpen"
        >
          Abstract
        </v-btn>
        <v-btn
          v-for="link in links"
          :key="link.label"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="tonal"
          color="secondary"
          :prepend-icon="link.icon"
        >
          {{ link.label }}
        </v-btn>
      </div>

      <v-expand-transition>
        <p v-if="canShowAbstract && abstractOpen" class="pub-abstract mt-3 mb-0">
          {{ publication.abstract }}
        </p>
      </v-expand-transition>
    </div>

    <a
      v-if="publication.thumbnailUrl"
      :href="primaryLink ?? undefined"
      :target="primaryLink ? '_blank' : undefined"
      :rel="primaryLink ? 'noopener noreferrer' : undefined"
      class="pub-thumb-wrap d-none d-sm-block flex-shrink-0"
      :aria-label="`${publication.title} (thumbnail)`"
    >
      <v-img :src="publication.thumbnailUrl" alt="" cover class="pub-thumb" />
    </a>
  </article>
</template>

<style scoped>
.pub-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.5;
  white-space: nowrap;
}

.pub-badge--review {
  background: var(--byu-light-blue);
  color: var(--byu-navy);
}

.pub-type {
  color: var(--byu-royal);
  font-size: 0.8125rem;
  font-weight: 500;
  font-style: italic;
}

.pub-type--status {
  margin-left: -0.25rem;
}

.pub-title {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 0.25rem;
}

.pub-title-link {
  color: inherit;
  text-decoration: none;
}

.pub-title-link:hover,
.pub-title-link:focus-visible {
  color: var(--byu-royal);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pub-authors,
.pub-venue {
  font-size: 0.9375rem;
  line-height: 1.55;
  margin: 0;
  color: var(--text-body);
}

.pub-authors :deep(strong) {
  color: var(--byu-navy);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--byu-light-blue);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.pub-venue {
  font-style: italic;
}

.pub-links .v-btn {
  letter-spacing: 0.01em;
  text-transform: none;
}

.pub-abstract {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-body);
  padding-left: 0.875rem;
  border-left: 3px solid var(--byu-light-blue);
}

.pub-thumb-wrap {
  width: 128px;
  height: 88px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.pub-thumb {
  width: 100%;
  height: 100%;
}
</style>
