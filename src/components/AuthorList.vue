<script setup lang="ts">
import { computed } from 'vue'
import type { PublicationAuthor } from '@/types/content'
import { formatAuthorSegments } from '@/utils/cvFormat'

const props = defineProps<{
  authors: PublicationAuthor[]
}>()

const segments = computed(() => formatAuthorSegments(props.authors ?? []))
</script>

<template>
  <span class="author-list"><template v-for="(segment, index) in segments" :key="index"><strong v-if="segment.bold">{{ segment.text }}</strong><template v-else>{{ segment.text }}</template></template></span>
</template>
