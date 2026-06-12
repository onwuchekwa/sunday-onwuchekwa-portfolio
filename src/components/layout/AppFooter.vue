<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'

const { settings, load } = useSiteSettings()
const year = new Date().getFullYear()

onMounted(load)
</script>

<template>
  <v-footer class="bg-primary text-white py-6">
    <v-container>
      <v-row align="center">
        <v-col cols="12" md="6">
          <div class="text-body-2">
            &copy; {{ year }} {{ settings.name }}. All rights reserved.
          </div>
        </v-col>
        <v-col cols="12" md="6" class="d-flex flex-wrap justify-md-end ga-2 footer-social">
          <v-btn
            v-for="link in settings.socialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :prepend-icon="link.icon || 'mdi-link'"
            variant="text"
            color="white"
            size="small"
          >
            {{ link.platform }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-social :deep(.v-btn) {
  color: #ffffff;
}

.footer-social :deep(.v-icon) {
  color: #ffffff;
}
</style>
