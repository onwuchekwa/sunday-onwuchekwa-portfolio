<script setup lang="ts">
</script>

<template>
  <v-container class="py-16">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6" class="text-center">
        <v-icon icon="mdi-compass-off-outline" size="96" color="primary" class="mb-6" />
        <h1 class="text-h2 font-weight-bold text-primary mb-2">404</h1>
        <h2 class="text-h5 font-weight-bold mb-4">Page not found</h2>
        <p class="text-body-1 text-medium-emphasis mb-8">
          The page you are looking for doesn't exist, has been moved, or is currently unavailable.
        </p>
        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn to="/" color="primary" size="large" prepend-icon="mdi-home">
            Back to home
          </v-btn>
          <v-btn to="/contact" variant="tonal" size="large" prepend-icon="mdi-email">
            Contact me
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
