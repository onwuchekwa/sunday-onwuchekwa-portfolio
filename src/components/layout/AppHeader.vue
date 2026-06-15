<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { PUBLIC_PAGES } from '@/types/content'
import ProfileAvatar from '@/components/ProfileAvatar.vue'

const { settings, load } = useSiteSettings()

const pageRoutes = {
  about: '/about',
  publications: '/publications',
  news: '/news',
  cv: '/cv',
  contact: '/contact',
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
  <v-app-bar flat color="primary" elevation="1" height="72">
    <v-container class="d-flex align-center py-0">
      <router-link to="/" class="brand-lockup text-decoration-none d-flex align-center ga-3">
        <ProfileAvatar
          :image-url="settings.profileImageUrl"
          :size="40"
          :icon-size="22"
        />
        <span class="text-h6 font-weight-bold text-white">{{ settings.name }}</span>
      </router-link>

      <v-spacer />

      <div class="d-none d-md-flex ga-1">
        <v-btn
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          variant="text"
          color="white"
        >
          {{ link.title }}
        </v-btn>
      </div>

      <div class="d-md-none">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-menu" variant="text" color="white" v-bind="props" />
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
    </v-container>
  </v-app-bar>
</template>

<style scoped>
.brand-lockup:hover {
  opacity: 0.92;
}
</style>
