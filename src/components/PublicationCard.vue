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
  /** Research themes to show as tag links under the paper. */
  themes?: { id: string; slug: string; title: string }[]
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
          variant="outlined"
          class="pub-link"
          :prepend-icon="link.icon"
        >
          {{ link.label }}
        </v-btn>
      </div>

      <p v-if="themes?.length" class="pub-themes">
        <router-link v-for="theme in themes" :key="theme.id" :to="`/research/${theme.slug}`" class="pub-theme">
          {{ theme.title }}
        </router-link>
      </p>

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
      <img :src="publication.thumbnailUrl" alt="" loading="lazy" class="pub-thumb" />
    </a>
  </article>
</template>

<style scoped>
.pub-badge {
  display: inline-block;
  padding: 0.0625rem 0.4375rem;
  border-radius: 4px;
  border: 1px solid var(--rule-strong);
  color: var(--heading);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.5;
  white-space: nowrap;
}

.pub-badge--review {
  border-style: dashed;
  color: var(--text-muted);
}

.pub-type {
  color: var(--text-muted);
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
  color: var(--text-strong);
  margin: 0 0 0.25rem;
}

.pub-title-link {
  color: inherit;
  text-decoration: none;
}

.pub-title-link:hover,
.pub-title-link:focus-visible {
  color: var(--accent);
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
  color: var(--text-strong);
  font-weight: 600;
}

.pub-venue {
  font-style: italic;
}

.pub-links .v-btn {
  letter-spacing: 0.01em;
  text-transform: none;
}

.pub-link {
  color: var(--text-body) !important;
  border-color: var(--rule-strong) !important;
}

.pub-link:hover {
  color: var(--accent) !important;
  border-color: currentColor !important;
}

.pub-themes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.625rem 0 0;
}

.pub-theme {
  padding: 0.0625rem 0.625rem;
  border-radius: 999px;
  background: var(--tint);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-body) !important;
  text-decoration: none;
}

.pub-theme:hover {
  color: var(--accent) !important;
  text-decoration: underline;
}

.pub-abstract {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-body);
  padding-left: 0.875rem;
  border-left: 3px solid var(--rule-strong);
}

.pub-thumb-wrap {
  align-self: flex-start;
  width: 168px;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--rule);
  background: rgb(var(--v-theme-surface));
}

/* The whole image, scaled to fit: figures and posters come in every shape. */
.pub-thumb {
  display: block;
  width: 100%;
  height: auto;
  max-height: 168px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
