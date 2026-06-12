<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    variant?: 'section' | 'subsection'
  }>(),
  {
    title: '',
    variant: 'section',
  },
)
</script>

<template>
  <div
    class="cv-section-heading"
    :class="variant === 'subsection' ? 'cv-section-heading--subsection' : 'cv-section-heading--section'"
  >
    <component :is="variant === 'subsection' ? 'h3' : 'h2'" class="cv-section-heading__text">
      <slot>{{ title }}</slot>
    </component>
  </div>
</template>

<style scoped>
@import './cv-section.css';
</style>
