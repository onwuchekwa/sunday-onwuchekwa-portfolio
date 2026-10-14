<script setup lang="ts">
import { usePdfExport } from '@/composables/usePdfExport'

const props = defineProps<{
  filename: string
  footerLabel?: string
}>()

const { printAsPdf } = usePdfExport()
</script>

<template>
  <div class="d-flex flex-column align-end">
    <v-btn color="primary" prepend-icon="mdi-file-download-outline" @click="printAsPdf(props.filename, props.footerLabel)">
      Download PDF
    </v-btn>
    <span class="cv-pdf-hint">Choose “Save as PDF” in the print dialog</span>
  </div>
</template>

<style scoped>
.cv-pdf-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-body);
  opacity: 0.8;
}
</style>
