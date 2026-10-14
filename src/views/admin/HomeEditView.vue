<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
import { useSiteSettings } from '@/composables/useSiteSettings'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

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
    <AdminPageHeader title="Home Page">
      <template #description>
        Everything on the public home page, top to bottom. The Research table comes from the
        <router-link :to="{ name: 'admin-cv' }">CV Builder</router-link> (Research Interests), and
        Selected Publications from
        <router-link :to="{ name: 'admin-publications' }">Publications</router-link> marked Featured.
      </template>
      <template #actions>
        <v-btn type="submit" form="home-form" color="primary" prepend-icon="mdi-content-save" :loading="saving">
          Save home page
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-progress-linear
      v-if="aboutLoading || settingsLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <v-card class="pa-6">
      <v-form id="home-form" @submit.prevent="handleSave">
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

        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      </v-form>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      Home page saved.
    </v-snackbar>
  </div>
</template>
