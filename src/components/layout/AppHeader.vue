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
  <v-app-bar flat color="background" height="60" class="app-header">
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
  border-top: 3px solid var(--heading);
  border-bottom: 1px solid var(--rule) !important;
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
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--heading) !important;
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
  color: var(--text-strong) !important;
  background: rgba(0, 0, 0, 0.04);
}

.app-header__link--active {
  color: var(--text-strong) !important;
  font-weight: 600;
}

.app-header__link--active::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -0.6rem;
  height: 2px;
  border-radius: 2px;
  background: var(--heading);
}
</style>
