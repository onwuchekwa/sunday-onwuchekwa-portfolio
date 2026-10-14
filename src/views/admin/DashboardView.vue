<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePublications } from '@/composables/usePublications'
import { useNews } from '@/composables/useNews'
import { useCv } from '@/composables/useCv'
import { resolvePublicationStatus } from '@/types/content'
import { formatLongDate } from '@/utils/date'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const { publications, load: loadPubs } = usePublications()
const { newsItems, load: loadNews } = useNews()
const { cv, load: loadCv } = useCv()

const stats = computed(() => {
  const statuses = publications.value.map(resolvePublicationStatus)
  return [
    {
      label: 'Publications',
      value: publications.value.length,
      detail: `${statuses.filter((s) => s === 'under_review').length} under review · ${publications.value.filter((p) => p.featured).length} featured`,
      icon: 'mdi-book-open-variant',
      to: { name: 'admin-publications' },
    },
    {
      label: 'News posts',
      value: newsItems.value.length,
      detail: `${newsItems.value.filter((n) => n.published).length} published`,
      icon: 'mdi-newspaper-variant-outline',
      to: { name: 'admin-news' },
    },
    {
      label: 'CV',
      value: cv.value.sections.filter((s) => s.visible).length,
      detail: cv.value.lastUpdated ? `sections · updated ${formatLongDate(cv.value.lastUpdated.slice(0, 10))}` : 'visible sections',
      icon: 'mdi-file-document-edit-outline',
      to: { name: 'admin-cv' },
    },
  ]
})

const shortcuts = [
  { title: 'Edit home page', description: 'Announcement, bio, beyond research', icon: 'mdi-home-edit-outline', to: { name: 'admin-home' } },
  { title: 'Add a publication', description: 'Type, status, venue badge, links', icon: 'mdi-plus-box-outline', to: { name: 'admin-publications', query: { new: '1' } } },
  { title: 'Post news', description: 'Shows in the sidebar and News page', icon: 'mdi-bullhorn-outline', to: { name: 'admin-news', query: { new: '1' } } },
  { title: 'Site settings', description: 'Name, photo, contact, links, pages', icon: 'mdi-cog-outline', to: { name: 'admin-settings' } },
]

onMounted(() => Promise.all([loadPubs(), loadNews(), loadCv()]))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Dashboard"
      description="Manage your portfolio content. Changes appear on the live site immediately."
    />

    <v-row class="mb-2">
      <v-col v-for="stat in stats" :key="stat.label" cols="12" sm="4">
        <v-card :to="stat.to" class="pa-5 h-100 admin-stat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="admin-stat__label">{{ stat.label }}</span>
            <v-icon :icon="stat.icon" color="secondary" size="22" />
          </div>
          <div class="admin-stat__value">{{ stat.value }}</div>
          <div class="admin-stat__detail">{{ stat.detail }}</div>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="admin-section-title">Quick actions</h2>
    <v-row>
      <v-col v-for="item in shortcuts" :key="item.title" cols="12" sm="6" lg="3">
        <v-card :to="item.to" class="pa-5 h-100 admin-shortcut">
          <v-icon :icon="item.icon" color="primary" size="26" class="mb-3" />
          <div class="admin-shortcut__title">{{ item.title }}</div>
          <div class="admin-shortcut__description">{{ item.description }}</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.admin-stat__label {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-body);
}

.admin-stat__value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--byu-navy);
}

.admin-stat__detail {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-body);
}

.admin-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--byu-navy);
  margin: 1rem 0 0.75rem;
}

.admin-shortcut__title {
  font-weight: 600;
  color: var(--byu-navy);
}

.admin-shortcut__description {
  font-size: 0.875rem;
  color: var(--text-body);
}

.admin-stat,
.admin-shortcut {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.admin-stat:hover,
.admin-shortcut:hover {
  border-color: rgba(0, 71, 186, 0.4) !important;
  box-shadow: 0 4px 14px rgba(0, 46, 93, 0.08);
}
</style>
