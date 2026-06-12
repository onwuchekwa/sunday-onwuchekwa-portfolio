<script setup lang="ts">
import { computed } from 'vue'
import type { Publication } from '@/types/content'

const props = defineProps<{
  publication: Publication
  showAbstract?: boolean
}>()

const primaryLink = computed(() => {
  const { links, sourceUrl } = props.publication
  return sourceUrl || links.doi || links.pdf || links.arxiv || null
})

const statusLabel = computed(() => {
  const parts = [props.publication.cvStatus, props.publication.year].filter(Boolean)
  return parts.length ? `(${parts.join(', ')})` : ''
})
</script>

<template>
  <v-card class="pub-card h-100" variant="outlined">
    <div class="d-flex flex-column flex-sm-row ga-0 h-100">
      <a
        v-if="publication.thumbnailUrl"
        :href="primaryLink ?? undefined"
        :target="primaryLink ? '_blank' : undefined"
        :rel="primaryLink ? 'noopener noreferrer' : undefined"
        class="pub-thumb-wrap flex-shrink-0"
        :class="{ 'pub-thumb-wrap--link': !!primaryLink }"
      >
        <v-img
          :src="publication.thumbnailUrl"
          :alt="`${publication.title} thumbnail`"
          cover
          class="pub-thumb"
        />
      </a>
      <div
        v-else
        class="pub-thumb-wrap pub-thumb-placeholder flex-shrink-0 d-flex align-center justify-center"
      >
        <v-icon icon="mdi-file-document-outline" size="40" color="secondary" />
      </div>

      <div class="pub-body pa-4 pa-sm-5 flex-grow-1">
        <p v-if="statusLabel" class="text-caption text-medium-emphasis mb-1 pub-status">
          {{ statusLabel }}
        </p>

        <h3 class="text-h6 font-weight-bold mb-2 pub-title">
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

        <p class="text-body-2 text-medium-emphasis mb-1">{{ publication.authors }}</p>
        <p v-if="publication.venue" class="text-body-2 font-italic mb-3">{{ publication.venue }}</p>

        <p
          v-if="showAbstract !== false && publication.abstract"
          class="text-body-2 pub-abstract mb-4"
        >
          {{ publication.abstract }}
        </p>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-if="publication.links.pdf"
            :href="publication.links.pdf"
            target="_blank"
            rel="noopener noreferrer"
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
            rel="noopener noreferrer"
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
            rel="noopener noreferrer"
            size="small"
            variant="tonal"
            prepend-icon="mdi-link-variant"
          >
            arXiv
          </v-btn>
          <v-btn
            v-if="publication.sourceUrl && publication.sourceUrl !== primaryLink"
            :href="publication.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="text"
            prepend-icon="mdi-open-in-new"
          >
            Source
          </v-btn>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.pub-card {
  overflow: hidden;
}

.pub-thumb-wrap {
  width: 100%;
  height: 160px;
  background: rgb(var(--v-theme-surface-variant));
}

@media (min-width: 600px) {
  .pub-thumb-wrap {
    width: 168px;
    height: auto;
    min-height: 168px;
  }
}

.pub-thumb-wrap--link {
  text-decoration: none;
}

.pub-thumb {
  width: 100%;
  height: 100%;
}

.pub-thumb-placeholder {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08),
    rgba(var(--v-theme-secondary), 0.12)
  );
}

.pub-title-link {
  color: inherit;
  text-decoration: none;
}

.pub-title-link:hover {
  color: rgb(var(--v-theme-secondary));
  text-decoration: underline;
}

.pub-abstract {
  line-height: 1.6;
}

.pub-status {
  font-style: italic;
}
</style>
