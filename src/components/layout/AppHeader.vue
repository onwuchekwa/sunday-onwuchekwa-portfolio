<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'

const { settings, load } = useSiteSettings()

const navLinks = [
  { title: 'About', to: '/about' },
  { title: 'Publications', to: '/publications' },
  { title: 'News', to: '/news' },
  { title: 'CV', to: '/cv' },
  { title: 'Contact', to: '/contact' },
]

onMounted(load)
</script>

<template>
  <v-app-bar flat color="surface" elevation="1" height="72">
    <v-container class="d-flex align-center py-0">
      <router-link to="/" class="text-decoration-none text-primary">
        <span class="text-h6 font-weight-bold">{{ settings.name }}</span>
      </router-link>

      <v-spacer />

      <div class="d-none d-md-flex ga-1">
        <v-btn
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          variant="text"
          color="primary"
        >
          {{ link.title }}
        </v-btn>
      </div>

      <v-menu class="d-md-none">
        <template #activator="{ props }">
          <v-btn icon="mdi-menu" variant="text" color="primary" v-bind="props" />
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
    </v-container>
  </v-app-bar>
</template>
