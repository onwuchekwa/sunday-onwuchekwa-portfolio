<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
import { useSiteSettings } from '@/composables/useSiteSettings'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import UnsavedChangesBar from '@/components/admin/UnsavedChangesBar.vue'
import { useNotify } from '@/composables/useNotify'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const { about, load: loadAbout, save: saveAbout, loading: aboutLoading } = useAbout()
const { settings, load: loadSettings, save: saveSettings, loading: settingsLoading } = useSiteSettings()
const notify = useNotify()
const saving = ref(false)
const error = ref<string | null>(null)

const { isDirty, markSaved } = useUnsavedChanges(() => ({
  bio: about.value.bio,
  headline: settings.value.headline,
  announcement: settings.value.announcement,
  beyondResearch: settings.value.beyondResearch,
}))

async function loadAll() {
  await Promise.all([loadAbout(), loadSettings()])
  markSaved()
}

onMounted(loadAll)

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    // The bio lives in the about doc; the other home-page text lives in site settings.
    await Promise.all([saveAbout({ ...about.value }), saveSettings({ ...settings.value })])
    markSaved()
    notify.success('Home page saved. It’s live now.')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
    notify.error('Couldn’t save the home page.', e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Home Page">
      <template #description>
        The text on your public home page, top to bottom. The line above the headline and the
        site description are in <router-link :to="{ name: 'admin-settings' }">Site Settings</router-link>;
        the Research cards come from the
        <router-link :to="{ name: 'admin-cv' }">CV Builder</router-link> (Research Interests); and
        Selected Publications shows papers marked Featured in
        <router-link :to="{ name: 'admin-publications' }">Publications</router-link>, then your
        latest accepted work.
      </template>
      <template #actions>
        <v-btn type="submit" form="home-form" color="primary" prepend-icon="mdi-content-save" :loading="saving" :disabled="!isDirty">
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
          v-model="settings.headline"
          label="Headline"
          rows="2"
          auto-grow
          hint="The large statement at the top of your home page: what you study, in one sentence. Leave empty to show “Hi, I’m …”."
          persistent-hint
          class="mb-6"
        />

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

    <UnsavedChangesBar :show="isDirty" :saving="saving" @save="handleSave" @discard="loadAll" />
  </div>
</template>
