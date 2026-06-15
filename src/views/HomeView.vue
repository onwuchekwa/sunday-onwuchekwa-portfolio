<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { usePublications } from '@/composables/usePublications'
import { useCv } from '@/composables/useCv'
import { useNews } from '@/composables/useNews'
import { toResearchInterestDisplay } from '@/utils/cvFormat'
import PublicationCard from '@/components/PublicationCard.vue'
import NewsCard from '@/components/NewsCard.vue'
import ProfileAvatar from '@/components/ProfileAvatar.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { publications, load: loadPubs, latestPublications } = usePublications()
const { cv, load: loadCv, visibleEntries } = useCv()
const { newsItems, load: loadNews, latestNews } = useNews()

const researchFocus = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  if (!section) return []
  return visibleEntries(section)
    .map(toResearchInterestDisplay)
    .filter((item) => item.title)
})

onMounted(async () => {
  await Promise.all([loadSettings(), loadPubs(), loadCv(), loadNews(true)])
})
</script>

<template>
  <div>
    <section class="hero-section py-16">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="8">
            <div class="hero-intro">
              <h1 class="text-h2 text-md-h1 font-weight-bold text-primary mb-3">
                {{ settings.name }}
              </h1>
              <p class="text-h6 text-md-h5 text-body-readable mb-4 hero-title">
                {{ settings.title }}
              </p>
              <p class="hero-tagline text-body-1 mb-8">
                {{ settings.tagline }}
              </p>
            </div>
            <div class="d-flex flex-wrap ga-3 hero-actions">
              <v-btn to="/about" color="primary" variant="flat" size="large" prepend-icon="mdi-account">
                About me
              </v-btn>
              <v-btn
                to="/publications"
                variant="outlined"
                color="primary"
                size="large"
                prepend-icon="mdi-book-open-variant"
              >
                Publications
              </v-btn>
              <v-btn
                to="/cv"
                variant="tonal"
                color="secondary"
                size="large"
                prepend-icon="mdi-file-document"
              >
                CV
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <ProfileAvatar
              :image-url="settings.profileImageUrl"
              :size="220"
              :icon-size="96"
              :show-border="false"
              class="mx-auto elevation-4"
            />
            <p
              v-if="!settings.profileImageUrl"
              class="text-caption text-body-readable mt-4"
            >
              Upload your photo in Admin → Settings
            </p>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <section v-if="publications.length" class="py-12 bg-surface-variant">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-primary mb-6">Recent Publications</h2>
        <v-row>
          <v-col
            v-for="pub in latestPublications(2)"
            :key="pub.id"
            cols="12"
            md="6"
          >
            <PublicationCard :publication="pub" :show-abstract="false" />
          </v-col>
        </v-row>
        <v-btn
          to="/publications"
          variant="text"
          color="primary"
          class="mt-4"
          append-icon="mdi-arrow-right"
        >
          See all publications
        </v-btn>
      </v-container>
    </section>

    <section v-if="newsItems.length" class="py-12">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-primary mb-6">Latest News</h2>
        <v-row>
          <v-col
            v-for="item in latestNews(3)"
            :key="item.id"
            cols="12"
            md="4"
          >
            <NewsCard :item="item" />
          </v-col>
        </v-row>
        <v-btn
          to="/news"
          variant="text"
          color="primary"
          class="mt-4"
          append-icon="mdi-arrow-right"
        >
          See all news
        </v-btn>
      </v-container>
    </section>

    <section v-if="researchFocus.length" class="py-12">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-primary mb-6">Research Focus</h2>
        <v-row>
          <v-col
            v-for="item in researchFocus"
            :key="item.title"
            cols="12"
            md="4"
          >
            <v-card class="pa-6 text-center h-100 research-card" variant="outlined">
              <v-icon :icon="item.icon" size="48" color="secondary" class="mb-4" />
              <h3 class="text-h6 font-weight-bold text-primary mb-3">{{ item.title }}</h3>
              <p class="text-body-2 text-body-readable">
                {{ item.description }}
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
  background: linear-gradient(135deg, #ffffff 0%, rgba(189, 214, 230, 0.2) 100%);
}

.hero-intro {
  width: 100%;
}

.hero-title {
  font-weight: 500;
  line-height: 1.5;
}

.hero-tagline {
  color: var(--byu-royal);
  font-weight: 500;
  line-height: 1.7;
  padding-left: 1rem;
  border-left: 4px solid var(--byu-royal);
  width: 100%;
  max-width: none;
  text-align: left;
}

.hero-actions .v-btn {
  min-width: 10.5rem;
}

.research-card {
  border-color: rgba(0, 71, 186, 0.2) !important;
  background: #ffffff;
}
</style>
