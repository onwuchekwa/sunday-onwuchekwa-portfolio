<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/admin' },
  { title: 'Site Settings', icon: 'mdi-cog', to: '/admin/settings' },
  { title: 'About', icon: 'mdi-account', to: '/admin/about' },
  { title: 'Publications', icon: 'mdi-book-open-variant', to: '/admin/publications' },
  { title: 'News', icon: 'mdi-newspaper', to: '/admin/news' },
  { title: 'CV Builder', icon: 'mdi-file-document-edit', to: '/admin/cv' },
]

async function handleLogout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer permanent width="260" color="primary">
      <div class="pa-4">
        <div class="text-h6 text-white font-weight-bold">Admin</div>
        <div class="text-caption text-white text-opacity-70">Sunday Onwuchekwa Portfolio</div>
      </div>
      <v-divider class="border-opacity-25" />
      <v-list nav density="compact" class="text-white">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="white"
          rounded="lg"
        />
      </v-list>
      <template #append>
        <div class="pa-4">
          <v-btn
            block
            variant="outlined"
            color="white"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            Sign out
          </v-btn>
          <v-btn
            block
            variant="text"
            color="white"
            class="mt-2"
            prepend-icon="mdi-open-in-new"
            to="/"
            target="_blank"
          >
            View site
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat color="surface" elevation="1">
      <v-app-bar-title class="text-body-1 font-weight-medium">
        Content Management
      </v-app-bar-title>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
