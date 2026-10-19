<script setup lang="ts">
defineProps<{ show: boolean; saving?: boolean; saveLabel?: string }>()
defineEmits<{ save: []; discard: [] }>()
</script>

<template>
  <v-slide-y-reverse-transition>
    <div v-if="show" class="unsaved-bar" role="status">
      <span class="unsaved-bar__text">
        <v-icon icon="mdi-circle" size="10" class="unsaved-bar__dot" />
        You have unsaved changes
      </span>
      <div class="d-flex ga-2">
        <v-btn variant="text" :disabled="saving" @click="$emit('discard')">Discard</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="$emit('save')">
          {{ saveLabel ?? 'Save changes' }}
        </v-btn>
      </div>
    </div>
  </v-slide-y-reverse-transition>
</template>

<style scoped>
/* Sits at the bottom of the viewport so Save is always in reach on long pages. */
.unsaved-bar {
  position: sticky;
  bottom: 1rem;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-top: 1.5rem;
  padding: 0.625rem 0.75rem 0.625rem 1.25rem;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  box-shadow: 0 8px 24px rgba(0, 46, 93, 0.14);
}

.unsaved-bar__text {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--byu-navy);
}

.unsaved-bar__dot {
  color: #c77700;
}
</style>
