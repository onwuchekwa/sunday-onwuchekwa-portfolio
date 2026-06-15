<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const code = computed(() => {
  const raw = String(route.query.code ?? '503')
  return raw === '504' ? '504' : '503'
})

const heading = computed(() =>
  code.value === '504' ? 'Request timed out' : 'Service temporarily unavailable',
)

function retry() {
  const from = typeof route.query.from === 'string' ? route.query.from : ''
  if (from.startsWith('/') && !from.startsWith('//')) {
    router.replace(from)
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <v-container class="py-16">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6" class="text-center">
        <v-icon icon="mdi-cloud-alert-outline" size="96" color="primary" class="mb-6" />
        <h1 class="text-h2 font-weight-bold text-primary mb-2">{{ code }}</h1>
        <h2 class="text-h5 font-weight-bold mb-4">{{ heading }}</h2>
        <p class="text-body-1 text-medium-emphasis mb-8">
          Something went wrong while loading this content. It's not you — please try again in a
          moment.
        </p>
        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn color="primary" size="large" prepend-icon="mdi-refresh" @click="retry">
            Try again
          </v-btn>
          <v-btn to="/" variant="tonal" size="large" prepend-icon="mdi-home">
            Back to home
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
