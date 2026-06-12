<script setup lang="ts">
import { ref } from 'vue'
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
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fileInput = ref<File[]>([])
const processing = ref(false)
const error = ref<string | null>(null)
const meta = ref<CompressedImage | null>(null)

async function handleFileSelect() {
  const file = fileInput.value[0]
  if (!file) return

  processing.value = true
  error.value = null
  meta.value = null

  try {
    const result = await compressImageToBase64(file, {
      maxDimension: props.maxDimension,
      maxBytes: props.maxBytes,
    })
    meta.value = result
    emit('update:modelValue', result.dataUrl)
    fileInput.value = []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Image processing failed'
  } finally {
    processing.value = false
  }
}

function clearImage() {
  emit('update:modelValue', '')
  meta.value = null
  error.value = null
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

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
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
        <div v-if="meta">
          Compressed to {{ formatBytes(meta.byteSize) }}
          ({{ meta.width }}×{{ meta.height }}px)
        </div>
        <div v-else>Image saved in Firestore</div>
        <v-btn size="small" variant="text" color="error" class="mt-1 px-0" @click="clearImage">
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
</style>
