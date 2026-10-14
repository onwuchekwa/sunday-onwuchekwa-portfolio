<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ProfileSidebar from '@/components/layout/ProfileSidebar.vue'

const route = useRoute()

/** Pages like the CV need the full width (its document is also the PDF source). */
const fullWidth = computed(() => route.meta.fullWidth === true)
/** On small screens the profile only shows on the home page, above the intro. */
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main class="bg-background">
      <div class="public-shell" :class="{ 'public-shell--full': fullWidth }">
        <div v-if="!fullWidth" class="public-shell__aside" :class="{ 'd-none d-md-block': !isHome }">
          <ProfileSidebar />
        </div>
        <div class="public-shell__content">
          <router-view />
        </div>
      </div>
    </v-main>
    <AppFooter />
  </v-app>
</template>

<style scoped>
.public-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 16px;
}

.public-shell__aside {
  padding: 1.5rem 0 0.5rem;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.public-shell__content {
  min-width: 0;
}

/* Views bring their own v-container; inside the shell it only needs vertical rhythm. */
.public-shell:not(.public-shell--full) .public-shell__content :deep(> .v-container),
.public-shell:not(.public-shell--full) .public-shell__content :deep(> div > .v-container) {
  max-width: none;
  padding-left: 0;
  padding-right: 0;
}

@media (min-width: 960px) {
  .public-shell:not(.public-shell--full) {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    gap: 3.5rem;
    padding: 0 24px;
  }

  .public-shell__aside {
    position: sticky;
    top: calc(var(--v-layout-top, 64px) + 2.5rem);
    align-self: start;
    max-height: calc(100vh - var(--v-layout-top, 64px) - 3.5rem);
    overflow-y: auto;
    padding: 2.5rem 0 1rem;
    margin-top: 0;
    border-bottom: 0;
    scrollbar-width: none;
  }

  /* Only show the sidebar's scrollbar when it's being used (short windows). */
  .public-shell__aside:hover {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 46, 93, 0.25) transparent;
  }
}
</style>
