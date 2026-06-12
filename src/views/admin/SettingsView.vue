<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { uploadFile, uploadPath } from '@/firebase/storage'
const { settings, load, save, loading } = useSiteSettings()
const saving = ref(false)
const snackbar = ref(false)
const imageFile = ref<File[]>([])

onMounted(load)

function addSocialLink() {
  settings.value.socialLinks.push({ platform: '', url: '', icon: 'mdi-link' })
}

function removeSocialLink(index: number) {
  settings.value.socialLinks.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  try {
    if (imageFile.value[0]) {
      const url = await uploadFile(imageFile.value[0], uploadPath('profile', imageFile.value[0].name))
      settings.value.profileImageUrl = url
      imageFile.value = []
    }
    await save({ ...settings.value })
    snackbar.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-6">Site Settings</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-card class="pa-6">
      <v-form @submit.prevent="handleSave">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.name" label="Full name" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.title" label="Title / Affiliation" required />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="settings.tagline" label="Tagline" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.email" label="Email" type="email" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-file-input
              v-model="imageFile"
              label="Profile photo"
              accept="image/*"
              prepend-icon="mdi-camera"
            />
            <v-img
              v-if="settings.profileImageUrl"
              :src="settings.profileImageUrl"
              max-height="120"
              max-width="120"
              class="rounded-lg mt-2"
            />
          </v-col>
        </v-row>

        <h2 class="text-h6 font-weight-bold mt-4 mb-3">Social Links</h2>
        <div v-for="(link, index) in settings.socialLinks" :key="index" class="mb-3">
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field v-model="link.platform" label="Platform" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="link.url" label="URL" />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field v-model="link.icon" label="Icon (mdi-*)" />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn icon="mdi-delete" variant="text" color="error" @click="removeSocialLink(index)" />
            </v-col>
          </v-row>
        </div>
        <v-btn variant="tonal" prepend-icon="mdi-plus" class="mb-6" @click="addSocialLink">
          Add link
        </v-btn>

        <v-btn type="submit" color="primary" size="large" :loading="saving">
          Save settings
        </v-btn>
      </v-form>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      Settings saved successfully.
    </v-snackbar>
  </div>
</template>
