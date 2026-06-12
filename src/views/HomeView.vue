<script setup lang="ts">
import { onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import PublicationCard from '@/components/PublicationCard.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { publications, load: loadPubs } = usePublications()

const featured = () => publications.value.filter((p) => p.featured).slice(0, 2)

onMounted(async () => {
  await Promise.all([loadSettings(), loadPubs()])
})
</script>

<template>
  <div>
    <section class="hero-section py-16">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="8">
            <p class="text-overline text-secondary mb-2">HCI · Human-Centered Computing</p>
            <h1 class="text-h2 font-weight-bold text-primary mb-4">
              {{ settings.name }}
            </h1>
            <p class="text-h5 text-medium-emphasis mb-2">{{ settings.title }}</p>
            <p class="text-h6 text-secondary mb-8">{{ settings.tagline }}</p>
            <div class="d-flex flex-wrap ga-3">
              <v-btn to="/about" color="primary" size="large">About my research</v-btn>
              <v-btn to="/publications" variant="outlined" color="primary" size="large">
                View publications
              </v-btn>
              <v-btn to="/cv" variant="tonal" color="secondary" size="large" prepend-icon="mdi-file-document">
                Academic CV
              </v-btn>
            </div>
          </v-col>
          <v-col v-if="settings.profileImageUrl" cols="12" md="4" class="text-center">
            <v-avatar size="220" class="elevation-4">
              <v-img :src="settings.profileImageUrl" cover alt="Profile photo" />
            </v-avatar>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section v-if="featured().length" class="py-12 bg-surface">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-primary mb-6">Featured Publications</h2>
        <v-row>
          <v-col v-for="pub in featured()" :key="pub.id" cols="12" md="6">
            <PublicationCard :publication="pub" />
          </v-col>
        </v-row>
        <v-btn to="/publications" variant="text" color="primary" class="mt-4" append-icon="mdi-arrow-right">
          See all publications
        </v-btn>
      </v-container>
    </section>

    <section class="py-12">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="pa-6 text-center h-100" color="surface-variant">
              <v-icon icon="mdi-church" size="48" color="secondary" class="mb-4" />
              <h3 class="text-h6 font-weight-bold mb-2">Religion & Technology</h3>
              <p class="text-body-2">
                Exploring how faith communities engage with digital tools and how technology shapes religious practice.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-6 text-center h-100" color="surface-variant">
              <v-icon icon="mdi-account-group" size="48" color="secondary" class="mb-4" />
              <h3 class="text-h6 font-weight-bold mb-2">Participatory Design</h3>
              <p class="text-body-2">
                Centering community voices in the design of technologies that serve diverse human needs.
              </p>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-6 text-center h-100" color="surface-variant">
              <v-icon icon="mdi-heart-pulse" size="48" color="secondary" class="mb-4" />
              <h3 class="text-h6 font-weight-bold mb-2">Human-Centered Computing</h3>
              <p class="text-body-2">
                Designing and studying technologies with attention to culture, values, and lived experience.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #faf8f5 0%, #f0ede8 100%);
}
</style>
