<script setup lang="ts">
import { computed } from 'vue'
import { formatCvCitation, type PublicationCategoryGroup } from '@/utils/cvFormat'
import AuthorList from '@/components/AuthorList.vue'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'

const props = defineProps<{
  groups: PublicationCategoryGroup[]
}>()

const legend = computed(() => props.groups.map((g) => `${g.code}=${g.legend}`).join(', '))

const rendered = computed(() =>
  props.groups.map((group) => ({
    ...group,
    entries: group.publications.map((pub, index) => ({
      pub,
      label: `${group.code}.${index + 1}`,
      citation: formatCvCitation(pub),
    })),
  })),
)
</script>

<template>
  <section v-if="groups.length" class="cv-section cv-publications">
    <CvSectionHeading>
      <span class="cv-pub-heading">
        <span>Publications</span>
        <span class="cv-pub-legend">{{ legend }}</span>
      </span>
    </CvSectionHeading>

    <div v-for="group in rendered" :key="group.id" class="cv-pub-group">
      <h3 class="cv-pub-group__title">[{{ group.title }}]</h3>
      <ol class="cv-pub-list">
        <li v-for="entry in group.entries" :key="entry.pub.id" class="cv-pub-entry">
          <span class="cv-pub-code">[{{ entry.label }}]</span>
          <AuthorList :authors="entry.pub.authors" class="cv-pub-authors" />
          {{ entry.citation.year }}
          <a
            v-if="entry.citation.link"
            :href="entry.citation.link"
            target="_blank"
            rel="noopener noreferrer"
            class="cv-pub-title"
            >{{ entry.citation.title }}</a
          ><strong v-else class="cv-pub-title">{{ entry.citation.title }}</strong>.
          {{ entry.citation.venue }}<template v-if="entry.citation.notes"> ({{ entry.citation.notes }})</template>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
@import './cv-section.css';
</style>
