<script setup lang="ts">
import { ref } from 'vue'
import { usePdfExport } from '@/composables/usePdfExport'

const props = defineProps<{
  targetId: string
  filename: string
}>()

const { exporting, exportElement } = usePdfExport()
const error = ref<string | null>(null)

async function download() {
  error.value = null
  const element = document.getElementById(props.targetId)
  if (!element) {
    error.value = 'CV content not found'
    return
  }
  try {
    await exportElement(element, props.filename)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'PDF export failed'
  }
}
</script>

<template>
  <div>
    <v-btn
      color="primary"
      prepend-icon="mdi-download"
      :loading="exporting"
      @click="download"
    >
      Download PDF
    </v-btn>
    <v-snackbar :model-value="!!error" color="error" timeout="4000" @update:model-value="error = null">
      {{ error }}
    </v-snackbar>
  </div>
</template>
