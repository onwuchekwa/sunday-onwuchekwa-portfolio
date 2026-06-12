<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'

const { settings, load } = useSiteSettings()

onMounted(load)
</script>

<template>
  <v-container class="py-12">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h3 font-weight-bold text-primary mb-2 text-center">Contact</h1>
        <p class="text-body-1 text-medium-emphasis mb-8 text-center">
          I welcome inquiries about research collaborations, speaking opportunities, and academic service.
        </p>

        <v-card class="pa-8">
          <div class="text-center mb-6">
            <v-avatar color="primary" size="64" class="mb-4">
              <v-icon icon="mdi-email" color="white" size="32" />
            </v-avatar>
            <div class="text-h6 font-weight-bold">{{ settings.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ settings.title }}</div>
          </div>

          <v-btn
            :href="`mailto:${settings.email}`"
            block
            color="primary"
            size="large"
            prepend-icon="mdi-email"
            class="mb-6"
          >
            {{ settings.email }}
          </v-btn>

          <v-divider class="mb-6" />

          <h2 class="text-h6 font-weight-bold mb-4">Connect</h2>
          <v-list lines="two">
            <v-list-item
              v-for="link in settings.socialLinks"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :prepend-icon="link.icon || 'mdi-link'"
              :title="link.platform"
              :subtitle="link.url"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
