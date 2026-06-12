<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useAbout } from '@/composables/useAbout'
import ProfileAvatar from '@/components/ProfileAvatar.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { about, load: loadAbout } = useAbout()

onMounted(async () => {
  await Promise.all([loadSettings(), loadAbout()])
})
</script>

<template>
  <v-container class="py-12">
    <v-row>
      <v-col cols="12" md="4" class="text-center">
        <ProfileAvatar
          :image-url="settings.profileImageUrl"
          :size="240"
          :icon-size="120"
          :show-border="false"
          class="mb-6 elevation-2"
        />
        <h2 class="text-h5 font-weight-bold">{{ settings.name }}</h2>
        <p class="text-body-1 text-medium-emphasis">{{ settings.title }}</p>
      </v-col>

      <v-col cols="12" md="8">
        <h1 class="text-h3 font-weight-bold text-primary mb-6">About</h1>

        <div class="text-body-1 mb-8" style="white-space: pre-line; line-height: 1.8">
          {{ about.bio || 'Bio coming soon.' }}
        </div>

        <div v-if="about.researchInterests.length" class="mb-8">
          <h2 class="text-h5 font-weight-bold mb-4">Research Interests</h2>
          <v-chip
            v-for="interest in about.researchInterests"
            :key="interest"
            class="ma-1"
            color="secondary"
            variant="tonal"
          >
            {{ interest }}
          </v-chip>
        </div>

        <div v-if="about.education.length">
          <h2 class="text-h5 font-weight-bold mb-4">Education</h2>
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="(edu, i) in about.education"
              :key="i"
              dot-color="primary"
              size="small"
            >
              <div class="font-weight-bold">{{ edu.degree }}</div>
              <div class="text-body-2">{{ edu.institution }}</div>
              <div class="text-caption text-medium-emphasis">{{ edu.year }}</div>
              <div v-if="edu.details" class="text-body-2 mt-1">{{ edu.details }}</div>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
