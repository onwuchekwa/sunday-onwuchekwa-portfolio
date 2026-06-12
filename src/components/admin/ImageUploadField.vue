<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  compressImageToBase64,
  formatBytes,
  type CompressedImage,
} from '@/utils/imageToBase64'

const props = defineProps<{
  modelValue: string
  label: string
  maxDimension: number
  maxBytes: number
  hint?: string
  cropMode?: 'none' | 'portrait-face'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type UploadStatus = 'idle' | 'compressing' | 'done' | 'error'

const fileInput = ref<File | File[] | null>(null)
const status = ref<UploadStatus>('idle')
const processingLabel = ref('')
const error = ref<string | null>(null)
const meta = ref<CompressedImage | null>(null)

const processing = computed(() => status.value === 'compressing')

function pickFile(value: File | File[] | null | undefined): File | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

async function handleFileSelect(value: File | File[] | null) {
  const file = pickFile(value)
  if (!file) return

  status.value = 'compressing'
  processingLabel.value = `Compressing ${formatBytes(file.size)} for Firestore…`
  error.value = null
  meta.value = null

  try {
    const result = await compressImageToBase64(file, {
      maxDimension: props.maxDimension,
      maxBytes: props.maxBytes,
      cropMode: props.cropMode ?? 'none',
    })
    meta.value = result
    emit('update:modelValue', result.dataUrl)
    fileInput.value = null
    status.value = 'done'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Image processing failed'
    fileInput.value = null
    status.value = 'error'
  }
}

function clearImage() {
  emit('update:modelValue', '')
  meta.value = null
  error.value = null
  status.value = 'idle'
  processingLabel.value = ''
}
</script>

<template>
  <div>
    <v-file-input
      v-model="fileInput"
      :label="label"
      accept="image/*"
      prepend-icon="mdi-image"
      :hint="hint ?? 'Compressed and saved directly to Firestore (no Cloud Storage)'"
      persistent-hint
      :loading="processing"
      @update:model-value="handleFileSelect"
    />

    <v-card
      v-if="status === 'compressing'"
      variant="outlined"
      class="mt-3 pa-4 compression-status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="d-flex align-center ga-3 mb-3">
        <v-progress-circular indeterminate size="22" width="2" color="primary" />
        <div>
          <div class="text-body-2 font-weight-medium">Compressing image…</div>
          <div class="text-caption text-medium-emphasis">{{ processingLabel }}</div>
        </div>
      </div>
      <v-progress-linear indeterminate color="primary" rounded />
    </v-card>

    <v-alert
      v-else-if="status === 'done' && meta"
      type="success"
      variant="tonal"
      density="comfortable"
      class="mt-3"
      icon="mdi-check-circle"
      aria-live="polite"
    >
      <strong>Done.</strong>
      <template v-if="cropMode === 'portrait-face'">
        Face-centered square crop applied.
      </template>
      Compressed {{ formatBytes(meta.sourceByteSize) }} →
      {{ formatBytes(meta.encodedByteSize) }}
      ({{ meta.width }}×{{ meta.height }}px).
      Click <strong>Save settings</strong> below to store in Firestore.
    </v-alert>

    <v-alert
      v-if="status === 'error' && error"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-3"
      aria-live="assertive"
    >
      {{ error }}
    </v-alert>

    <div v-if="modelValue" class="mt-3 d-flex align-center ga-4">
      <v-img
        :src="modelValue"
        max-height="100"
        max-width="100"
        cover
        class="rounded-lg border"
      />
      <div class="text-caption text-medium-emphasis">
        <v-btn size="small" variant="text" color="error" class="px-0" @click="clearImage">
          Remove image
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.compression-status {
  border-color: rgba(var(--v-theme-primary), 0.35);
}
</style>
