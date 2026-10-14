<script setup lang="ts">
import { computed } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

const { request, settle } = useConfirm()

const open = computed({
  get: () => request.value !== null,
  set: (value) => {
    if (!value) settle(false)
  },
})
</script>

<template>
  <v-dialog v-model="open" max-width="440">
    <v-card v-if="request" class="pa-2">
      <v-card-title class="text-h6 font-weight-bold text-wrap">{{ request.title }}</v-card-title>
      <v-card-text v-if="request.message" class="text-body-2 text-body-readable">
        {{ request.message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="settle(false)">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="settle(true)">
          {{ request.confirmText ?? 'Delete' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
