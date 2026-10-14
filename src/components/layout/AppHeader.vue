<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { PUBLIC_PAGES } from '@/types/content'

const { settings, load } = useSiteSettings()

const pageRoutes = {
  publications: '/publications',
  news: '/news',
  cv: '/cv',
} as const

const navLinks = computed(() =>
  PUBLIC_PAGES.filter((page) => settings.value.pageVisibility[page.id] !== false).map((page) => ({
    title: page.title,
    to: pageRoutes[page.id],
  })),
)

onMounted(load)
</script>

<template>
  <v-app-bar flat color="surface" height="60" class="app-header">
    <div class="app-header__inner d-flex align-center">
      <router-link to="/" class="app-header__brand">{{ settings.name }}</router-link>

      <v-spacer />

      <nav class="d-none d-md-flex ga-1" aria-label="Main">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="app-header__link"
          active-class="app-header__link--active"
        >
          {{ link.title }}
        </router-link>
      </nav>

      <div class="d-md-none">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" variant="text" color="primary" aria-label="Open menu" v-bind="props" />
          </template>
          <v-list>
            <v-list-item
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              :title="link.title"
            />
          </v-list>
        </v-menu>
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  border-top: 4px solid var(--byu-navy);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.12) !important;
}

.app-header__inner {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 960px) {
  .app-header__inner {
    padding: 0 24px;
  }
}

.app-header__brand {
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--byu-navy) !important;
  text-decoration: none;
}

.app-header__link {
  position: relative;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-body) !important;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.app-header__link:hover {
  color: var(--byu-navy) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.app-header__link--active {
  color: var(--byu-navy) !important;
  font-weight: 600;
}

.app-header__link--active::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -0.6rem;
  height: 3px;
  border-radius: 2px;
  background: var(--byu-royal);
}
</style>
