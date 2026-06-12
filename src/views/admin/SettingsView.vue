<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import {
  estimateDocumentSize,
  FIRESTORE_DOC_LIMIT_BYTES,
  PROFILE_IMAGE_MAX_BYTES,
} from '@/utils/imageToBase64'
import { defaultSiteSettings } from '@/types/content'

const { settings, load, save, loading } = useSiteSettings()
const saving = ref(false)
const snackbar = ref(false)
const error = ref<string | null>(null)

onMounted(load)

function addSocialLink() {
  settings.value.socialLinks.push({ platform: '', url: '', icon: 'mdi-link' })
}

function removeSocialLink(index: number) {
  settings.value.socialLinks.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    const docSize = estimateDocumentSize({ ...settings.value })
    if (docSize > FIRESTORE_DOC_LIMIT_BYTES) {
      throw new Error(
        `Document too large (${Math.round(docSize / 1024)} KB). Use a smaller profile photo.`,
      )
    }
    await save({
      ...defaultSiteSettings(),
      ...settings.value,
      profileImageUrl: settings.value.profileImageUrl ?? '',
      websiteUrl: settings.value.websiteUrl ?? '',
      phone: settings.value.phone ?? '',
    })
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
            <v-text-field
              v-model="settings.phone"
              label="Phone"
              hint="Shown on your CV header"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.websiteUrl"
              label="Website URL"
              hint="Shown on your CV header (e.g. https://sunday-onwuchekwa.web.app)"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <ImageUploadField
              v-model="settings.profileImageUrl"
              label="Profile photo"
              :max-dimension="400"
              :max-bytes="PROFILE_IMAGE_MAX_BYTES"
              crop-mode="portrait-face"
              hint="Large originals are auto-cropped to center your face, then compressed for Firestore."
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

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

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
