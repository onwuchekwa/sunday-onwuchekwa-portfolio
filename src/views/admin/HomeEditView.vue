<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
import { useSiteSettings } from '@/composables/useSiteSettings'

const { about, load: loadAbout, save: saveAbout, loading: aboutLoading } = useAbout()
const { settings, load: loadSettings, save: saveSettings, loading: settingsLoading } = useSiteSettings()
const saving = ref(false)
const snackbar = ref(false)
const error = ref<string | null>(null)

onMounted(() => Promise.all([loadAbout(), loadSettings()]))

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    // The bio lives in the about doc; the other home-page text lives in site settings.
    await Promise.all([saveAbout({ ...about.value }), saveSettings({ ...settings.value })])
    snackbar.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-2">Home Page</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Everything on the public home page, top to bottom. The Research table and Recent Publications
      come from the <router-link :to="{ name: 'admin-cv' }">CV Builder</router-link> (Research
      Interests) and <router-link :to="{ name: 'admin-publications' }">Publications</router-link>.
    </p>

    <v-progress-linear
      v-if="aboutLoading || settingsLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <v-card class="pa-6">
      <v-form @submit.prevent="handleSave">
        <v-textarea
          v-model="settings.announcement"
          label="Announcement (optional)"
          rows="2"
          auto-grow
          hint="Highlighted callout under your name, e.g. 'Seeking a research internship for Summer 2027 in …'. Leave empty to hide."
          persistent-hint
          class="mb-6"
        />

        <v-textarea
          v-model="about.bio"
          label="Bio"
          rows="10"
          auto-grow
          hint="The main introduction on your home page, written in first person. Separate paragraphs with a blank line."
          persistent-hint
          class="mb-6"
        />

        <v-textarea
          v-model="settings.beyondResearch"
          label="Beyond research (optional)"
          rows="2"
          auto-grow
          hint="A short personal paragraph at the end of the home page. Leave empty to hide."
          persistent-hint
          class="mb-6"
        />

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

        <v-btn type="submit" color="primary" size="large" :loading="saving">
          Save home page
        </v-btn>
      </v-form>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      Home page saved.
    </v-snackbar>
  </div>
</template>
