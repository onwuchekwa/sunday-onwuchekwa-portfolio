<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile, uploadPath } from '@/firebase/storage'

const profileFile = ref<File[]>([])
const newsFile = ref<File[]>([])
const uploading = ref(false)
const uploadedUrl = ref<string | null>(null)
const error = ref<string | null>(null)

async function upload(category: 'profile' | 'news', files: File[]) {
  if (!files[0]) return
  uploading.value = true
  error.value = null
  uploadedUrl.value = null
  try {
    const url = await uploadFile(files[0], uploadPath(category, files[0].name))
    uploadedUrl.value = url
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Upload failed'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-2">Media Uploads</h1>
    <p class="text-body-2 text-medium-emphasis mb-8">
      Upload images here, then copy the URL into Site Settings (profile photo) or News posts (featured image).
    </p>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-6">
          <h2 class="text-h6 font-weight-bold mb-4">Profile Photo</h2>
          <v-file-input
            v-model="profileFile"
            label="Select image"
            accept="image/*"
            prepend-icon="mdi-camera"
          />
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="!profileFile.length"
            @click="upload('profile', profileFile)"
          >
            Upload
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-6">
          <h2 class="text-h6 font-weight-bold mb-4">News Image</h2>
          <v-file-input
            v-model="newsFile"
            label="Select image"
            accept="image/*"
            prepend-icon="mdi-image"
          />
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="!newsFile.length"
            @click="upload('news', newsFile)"
          >
            Upload
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="uploadedUrl" type="success" variant="tonal" class="mt-6">
      <div class="font-weight-bold mb-2">Upload successful! Copy this URL:</div>
      <code class="text-body-2">{{ uploadedUrl }}</code>
    </v-alert>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>
