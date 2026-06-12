<script setup lang="ts">
import {
  CV_PUBLICATION_FOOTNOTES,
  formatPublicationCitation,
  type PublicationCategoryGroup,
} from '@/utils/cvFormat'
import CvSectionHeading from '@/components/cv/CvSectionHeading.vue'

defineProps<{
  intro?: string
  groups: PublicationCategoryGroup[]
}>()
</script>

<template>
  <section v-if="groups.length" class="cv-section cv-publications">
    <CvSectionHeading title="Refereed Publications &amp; Papers" />
    <p v-if="intro" class="cv-pub-intro">{{ intro }}</p>

    <template v-for="group in groups" :key="group.category">
      <CvSectionHeading variant="subsection">
        {{ group.title }}<span v-if="group.category === 'journal_article'"> ᐩ</span>
      </CvSectionHeading>
      <p
        v-if="group.category === 'journal_article'"
        class="cv-pub-footnote"
      >
        {{ CV_PUBLICATION_FOOTNOTES.journalModel }}
      </p>
      <p
        v-if="group.category === 'workshop_extended_abstract'"
        class="cv-pub-footnote"
      >
        ** {{ CV_PUBLICATION_FOOTNOTES.workshop }}
      </p>
      <div
        v-for="pub in group.publications"
        :key="pub.id"
        class="cv-pub-entry"
      >
        {{ formatPublicationCitation(pub) }}
      </div>
    </template>
  </section>
</template>

<style scoped>
@import './cv-section.css';

.cv-publications {
  page-break-before: auto;
}
</style>
