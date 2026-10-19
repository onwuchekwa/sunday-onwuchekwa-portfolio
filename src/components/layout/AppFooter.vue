<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import SocialIcon from '@/components/SocialIcon.vue'

const { settings, load } = useSiteSettings()
const year = new Date().getFullYear()

const socialLinks = computed(() => settings.value.socialLinks.filter((link) => link.url))

onMounted(load)
</script>

<template>
  <v-footer class="app-footer" color="background">
    <div class="app-footer__inner">
      <div class="app-footer__contact">
        <a v-if="settings.email" :href="`mailto:${settings.email}`" class="app-footer__email">
          <v-icon icon="mdi-email-outline" size="18" />
          {{ settings.email }}
        </a>
        <nav v-if="socialLinks.length" class="app-footer__social" aria-label="Profiles">
          <a
            v-for="link in socialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="app-footer__link"
          >
            <SocialIcon :link="link" :size="16" />
            {{ link.platform }}
          </a>
        </nav>
      </div>
      <p class="app-footer__copy">
        &copy; {{ year }} {{ settings.name }}<template v-if="settings.affiliation"> · {{ settings.affiliation }}</template>
      </p>
    </div>
  </v-footer>
</template>

<style scoped>
/* Matches the header: paper background with a hairline rule. */
.app-footer {
  flex: 0 0 auto;
  padding: 1.25rem 0;
  margin-top: 3rem;
  border-top: 1px solid var(--rule);
}

.app-footer__inner {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
}

@media (min-width: 960px) {
  .app-footer__inner {
    padding: 0 24px;
  }
}

.app-footer__contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1rem;
}

.app-footer__email {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-strong) !important;
  text-decoration: none;
}

.app-footer__email:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.app-footer__social {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}

.app-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-body) !important;
  text-decoration: none;
}

.app-footer__link svg,
.app-footer__link .v-icon {
  color: var(--text-muted);
}

.app-footer__link:hover {
  color: var(--accent) !important;
}

.app-footer__copy {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}
</style>
