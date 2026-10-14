<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { publicSiteOrigin } from '@/utils/hosts'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { mdAndUp } = useDisplay()

/** Always open on desktop; a toggleable overlay on tablets and phones. */
const drawer = ref(mdAndUp.value)
watch(mdAndUp, (wide) => {
  drawer.value = wide
})
watch(
  () => route.fullPath,
  () => {
    if (!mdAndUp.value) drawer.value = false
  },
)

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: { name: 'admin-dashboard' }, exact: true },
  { title: 'Home Page', icon: 'mdi-home-edit-outline', to: { name: 'admin-home' } },
  { title: 'Publications', icon: 'mdi-book-open-variant', to: { name: 'admin-publications' } },
  { title: 'News', icon: 'mdi-newspaper-variant-outline', to: { name: 'admin-news' } },
  { title: 'CV Builder', icon: 'mdi-file-document-edit-outline', to: { name: 'admin-cv' } },
  { title: 'Site Settings', icon: 'mdi-cog-outline', to: { name: 'admin-settings' } },
]

const currentTitle = computed(
  () => navItems.find((item) => item.to.name === route.name)?.title ?? 'Admin',
)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="mdAndUp"
      :temporary="!mdAndUp"
      width="248"
      color="primary"
      class="admin-drawer"
    >
      <div class="admin-drawer__brand">
        <div class="admin-drawer__title">Portfolio Admin</div>
        <div class="admin-drawer__subtitle">Sunday O. Onwuchekwa</div>
      </div>
      <v-list nav density="comfortable" class="admin-drawer__nav">
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :to="item.to"
          :exact="item.exact"
          :prepend-icon="item.icon"
          :title="item.title"
          color="white"
          rounded="lg"
        />
      </v-list>
      <template #append>
        <div class="pa-3 d-flex flex-column ga-2">
          <v-btn
            block
            variant="tonal"
            color="white"
            prepend-icon="mdi-open-in-new"
            :href="publicSiteOrigin"
            target="_blank"
            rel="noopener"
          >
            View site
          </v-btn>
          <v-btn block variant="text" color="white" prepend-icon="mdi-logout" @click="handleLogout">
            Sign out
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="surface" height="60" class="admin-bar">
      <v-app-bar-nav-icon
        v-if="!mdAndUp"
        color="primary"
        aria-label="Open navigation"
        @click="drawer = !drawer"
      />
      <v-app-bar-title class="admin-bar__title">{{ currentTitle }}</v-app-bar-title>
    </v-app-bar>

    <v-main class="bg-background">
      <div class="admin-content">
        <router-view />
      </div>
    </v-main>

    <ConfirmDialog />
  </v-app>
</template>

<style scoped>
.admin-drawer__brand {
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.admin-drawer__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #ffffff;
}

.admin-drawer__subtitle {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
}

.admin-drawer__nav :deep(.v-list-item-title) {
  font-weight: 500;
}

.admin-bar {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.12) !important;
  box-shadow: none !important;
}

.admin-bar__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--byu-navy);
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

@media (min-width: 960px) {
  .admin-content {
    padding: 2rem 2rem 3rem;
  }
}
</style>
