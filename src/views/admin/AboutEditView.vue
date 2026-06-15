<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
const { about, load, save, loading } = useAbout()
const saving = ref(false)
const snackbar = ref(false)

onMounted(load)

async function handleSave() {
  saving.value = true
  try {
    await save({ ...about.value })
    snackbar.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-6">Edit About</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-card class="pa-6">
      <v-form @submit.prevent="handleSave">
        <v-textarea
          v-model="about.bio"
          label="Bio"
          rows="8"
          hint="Your academic biography"
          persistent-hint
          class="mb-6"
        />

        <v-alert type="info" variant="tonal" density="comfortable" class="mb-6">
          Research Interests and Education on the About page — and Research Focus on the home page
          — are pulled from the
          <router-link to="/admin/cv">CV Builder</router-link>
          (sections: <strong>Research Interests</strong> and <strong>Education</strong>) — one
          source for all three.
        </v-alert>

        <v-btn type="submit" color="primary" size="large" :loading="saving">
          Save about
        </v-btn>
      </v-form>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      About page saved successfully.
    </v-snackbar>
  </div>
</template>
