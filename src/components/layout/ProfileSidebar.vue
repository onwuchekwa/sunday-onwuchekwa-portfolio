<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useNews } from '@/composables/useNews'
import { formatMonthYear } from '@/utils/date'
import ProfileAvatar from '@/components/ProfileAvatar.vue'

const { settings, load: loadSettings } = useSiteSettings()
const { load: loadNews, latestNews } = useNews()

const newsVisible = computed(() => settings.value.pageVisibility.news !== false)
const recentNews = computed(() => (newsVisible.value ? latestNews(3) : []))
const socialLinks = computed(() => settings.value.socialLinks.filter((link) => link.url))

onMounted(() => Promise.all([loadSettings(), loadNews(true)]))
</script>

<template>
  <aside class="profile-sidebar" aria-label="Profile">
    <div class="profile-sidebar__identity">
      <ProfileAvatar
        :image-url="settings.profileImageUrl"
        :size="148"
        :icon-size="72"
        :show-border="false"
        class="profile-sidebar__avatar"
      />
      <div>
        <p class="profile-sidebar__name">{{ settings.name }}</p>
        <a v-if="settings.email" :href="`mailto:${settings.email}`" class="profile-sidebar__email">
          {{ settings.email }}
        </a>
      </div>
    </div>

    <ul class="profile-sidebar__facts">
      <li v-if="settings.location">
        <v-icon icon="mdi-map-marker-outline" size="18" />
        <span>{{ settings.location }}</span>
      </li>
      <li v-if="settings.affiliation">
        <v-icon icon="mdi-school-outline" size="18" />
        <span>{{ settings.affiliation }}</span>
      </li>
      <li v-for="link in socialLinks" :key="link.url">
        <v-icon :icon="link.icon || 'mdi-link-variant'" size="18" />
        <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.platform }}</a>
      </li>
    </ul>

    <section v-if="recentNews.length" class="profile-sidebar__news" aria-labelledby="sidebar-news">
      <h2 id="sidebar-news" class="profile-sidebar__heading">Recent news</h2>
      <ul>
        <li v-for="item in recentNews" :key="item.id">
          <span class="profile-sidebar__date">{{ formatMonthYear(item.date) }}</span>
          <router-link :to="`/news/${item.id}`">{{ item.title }}</router-link>
        </li>
      </ul>
      <router-link to="/news" class="profile-sidebar__more">
        More news <v-icon icon="mdi-arrow-right" size="16" />
      </router-link>
    </section>
  </aside>
</template>

<style scoped>
.profile-sidebar {
  font-size: 0.9375rem;
  color: var(--text-body);
}

.profile-sidebar__identity {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-sidebar__name {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--byu-navy);
  margin: 0 0 0.125rem;
}

.profile-sidebar__email {
  color: var(--byu-royal) !important;
  font-size: 0.875rem;
  text-decoration: none;
  word-break: break-all;
}

.profile-sidebar__email:hover {
  text-decoration: underline;
}

.profile-sidebar__facts {
  list-style: none;
  padding: 0;
  margin: 1.25rem 0 0;
  display: grid;
  gap: 0.5rem;
}

.profile-sidebar__facts li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  line-height: 1.4;
}

.profile-sidebar__facts .v-icon {
  color: var(--byu-navy);
  flex-shrink: 0;
}

.profile-sidebar__facts a {
  text-decoration: none;
}

.profile-sidebar__facts a:hover {
  color: var(--byu-royal);
  text-decoration: underline;
}

.profile-sidebar__news {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.profile-sidebar__heading {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--byu-navy);
  margin: 0 0 0.75rem;
}

.profile-sidebar__news ul {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: grid;
  gap: 0.75rem;
}

.profile-sidebar__news li {
  display: grid;
  gap: 0.125rem;
  font-size: 0.875rem;
  line-height: 1.45;
}

.profile-sidebar__news li a {
  text-decoration: none;
}

.profile-sidebar__news li a:hover {
  color: var(--byu-royal);
  text-decoration: underline;
}

.profile-sidebar__date {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--byu-royal);
}

.profile-sidebar__more {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--byu-royal) !important;
  text-decoration: none;
}

.profile-sidebar__more:hover {
  text-decoration: underline;
}

/* Below md the sidebar sits above the page content as a compact profile row. */
@media (max-width: 959.98px) {
  .profile-sidebar__identity {
    flex-direction: row;
    align-items: center;
  }

  .profile-sidebar__avatar {
    width: 88px !important;
    height: 88px !important;
  }

  .profile-sidebar__facts {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  /* Keep the intro near the top; News is one tap away in the menu. */
  .profile-sidebar__news {
    display: none;
  }
}
</style>
