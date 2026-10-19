<script setup lang="ts">
import { computed } from 'vue'
import { useNotify } from '@/composables/useNotify'

const { notice, dismiss } = useNotify()

const open = computed({
  get: () => notice.value !== null,
  set: (value) => {
    if (!value) dismiss()
  },
})
</script>

<template>
  <!-- Errors stay until dismissed; confirmations fade on their own. -->
  <v-snackbar
    :key="notice?.id"
    v-model="open"
    :color="notice?.kind === 'error' ? 'error' : 'success'"
    :timeout="notice?.kind === 'error' ? -1 : 3000"
    location="bottom right"
    multi-line
  >
    {{ notice?.text }}
    <template #actions>
      <v-btn variant="text" @click="dismiss">{{ notice?.kind === 'error' ? 'Dismiss' : 'OK' }}</v-btn>
    </template>
  </v-snackbar>
</template>
