<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'This page is under construction',
  },
)
</script>

<template>
  <v-row justify="center" class="py-10">
    <v-col cols="12" md="8" lg="6" class="text-center">
      <v-icon icon="mdi-tools" size="80" color="primary" class="mb-5" />
      <h2 class="text-h5 font-weight-bold mb-3">{{ title }}</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">
        Content is on its way — please check back soon.
      </p>
      <v-btn to="/" variant="tonal" color="primary" prepend-icon="mdi-home">
        Back to home
      </v-btn>
    </v-col>
  </v-row>
</template>
