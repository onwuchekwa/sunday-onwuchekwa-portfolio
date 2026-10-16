<script setup lang="ts">
import { isExternalHref, type InlineSegment } from '@/utils/news'

defineProps<{
  segments: InlineSegment[]
}>()
</script>

<template>
  <template v-for="(segment, i) in segments" :key="i">
    <router-link v-if="segment.href && !isExternalHref(segment.href) && segment.href.startsWith('/')" :to="segment.href">{{
      segment.text
    }}</router-link>
    <a
      v-else-if="segment.href"
      :href="segment.href"
      :target="isExternalHref(segment.href) ? '_blank' : undefined"
      :rel="isExternalHref(segment.href) ? 'noopener noreferrer' : undefined"
      >{{ segment.text }}</a
    >
    <strong v-else-if="segment.bold">{{ segment.text }}</strong>
    <em v-else-if="segment.italic">{{ segment.text }}</em>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
