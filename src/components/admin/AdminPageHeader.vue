<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="admin-page-header">
    <div class="admin-page-header__text">
      <h1 class="admin-page-header__title">{{ title }}</h1>
      <p v-if="description || $slots.description" class="admin-page-header__description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="admin-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.admin-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.admin-page-header__text {
  min-width: 0;
  flex: 1 1 22rem;
}

.admin-page-header__title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--byu-navy);
  margin: 0;
}

.admin-page-header__description {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--text-body);
}

.admin-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
