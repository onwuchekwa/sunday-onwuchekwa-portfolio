<script setup lang="ts">
import { computed } from 'vue'
import type { SiteSettings } from '@/types/content'

const props = defineProps<{
  settings: SiteSettings
  /** Research interest titles, shown as a keyword line under the links */
  keywords?: string[]
}>()

const phone = computed(() => props.settings.phone?.trim() ?? '')

/** Labeled profile links (Personal Website | Google Scholar | …), skipping placeholder URLs. */
const links = computed(() => {
  const items: { label: string; href: string; icon: string }[] = []
  const website = props.settings.websiteUrl?.trim()
  if (website) items.push({ label: 'Personal Website', href: website, icon: 'mdi-web' })
  for (const link of props.settings.socialLinks ?? []) {
    const url = link.url?.trim()
    if (!url || !hasProfilePath(url)) continue
    items.push({ label: link.platform, href: url, icon: link.icon || 'mdi-link-variant' })
  }
  return items
})

/** "https://linkedin.com" alone is a placeholder, not a profile. */
function hasProfilePath(url: string): boolean {
  try {
    const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    return Boolean(parsed.pathname.replace(/\/+$/, '') || parsed.search)
  } catch {
    return false
  }
}
</script>

<template>
  <header class="cv-header">
    <h1 class="cv-name">{{ settings.name }}</h1>
    <p v-if="settings.email || phone" class="cv-contact">
      <template v-if="settings.email">
        E-mail: <a :href="`mailto:${settings.email}`">{{ settings.email }}</a>
      </template>
      <template v-if="phone">
        <span v-if="settings.email" class="cv-sep" aria-hidden="true"> | </span>
        Phone: <a :href="`tel:${phone.replace(/[^\d+]/g, '')}`">{{ phone }}</a>
      </template>
    </p>
    <p v-if="links.length" class="cv-links">
      <template v-for="(link, index) in links" :key="link.href">
        <span v-if="index > 0" class="cv-sep" aria-hidden="true"> | </span>
        <a :href="link.href" target="_blank" rel="noopener noreferrer">
          <v-icon :icon="link.icon" size="1.05em" class="cv-link-icon" />{{ link.label }}
        </a>
      </template>
    </p>
    <p v-if="keywords?.length" class="cv-keywords">
      <template v-for="(keyword, index) in keywords" :key="keyword">
        <span v-if="index > 0" class="cv-sep" aria-hidden="true"> | </span>{{ keyword }}
      </template>
    </p>
  </header>
</template>

<style scoped>
.cv-header {
  text-align: center;
  margin-bottom: 1.1em;
}

.cv-name {
  font-family: inherit;
  font-size: 2.6em;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0;
  color: var(--cv-ink-strong);
  margin: 0 0 0.15em;
}

.cv-contact,
.cv-links,
.cv-keywords {
  margin: 0 0 0.3em;
  line-height: 1.45;
}

.cv-contact a,
.cv-links a {
  color: var(--cv-link);
  text-decoration: none;
}

.cv-contact a:hover,
.cv-links a:hover {
  text-decoration: underline;
}

.cv-link-icon {
  margin-right: 0.2em;
  vertical-align: -0.12em;
  color: var(--cv-ink-strong);
}

.cv-sep {
  color: var(--cv-ink);
  padding: 0 0.15em;
}

.cv-keywords {
  margin-bottom: 0;
}
</style>
