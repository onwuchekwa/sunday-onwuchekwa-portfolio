<script setup lang="ts">
import { computed } from 'vue'
import type { SiteSettings } from '@/types/content'

const props = defineProps<{
  settings: SiteSettings
}>()

const contactItems = computed(() => {
  const items: { id: string; href: string; label: string; external?: boolean }[] = []

  if (props.settings.email?.trim()) {
    items.push({
      id: 'email',
      href: `mailto:${props.settings.email.trim()}`,
      label: props.settings.email.trim(),
    })
  }

  const phone = props.settings.phone?.trim()
  if (phone) {
    items.push({
      id: 'phone',
      href: `tel:${phone.replace(/[^\d+]/g, '')}`,
      label: phone,
    })
  }

  const website = props.settings.websiteUrl?.trim()
  if (website) {
    items.push({
      id: 'website',
      href: website,
      label: displayWebsite(website),
      external: true,
    })
  }

  return items
})

function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
</script>

<template>
  <header class="cv-header text-center">
    <h1 class="cv-name">{{ settings.name }}</h1>
    <p class="cv-title">{{ settings.title }}</p>
    <p v-if="contactItems.length" class="cv-contact">
      <template v-for="(item, index) in contactItems" :key="item.id">
        <span v-if="index > 0" class="cv-contact-sep" aria-hidden="true"> | </span>
        <a
          :href="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noopener noreferrer' : undefined"
        >
          {{ item.label }}
        </a>
      </template>
    </p>
  </header>
</template>

<style scoped>
.cv-header {
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #002e5d;
}

.cv-name {
  font-family: 'Lora', serif;
  font-size: 1.85rem;
  font-weight: 700;
  color: #002e5d;
  margin-bottom: 0.3rem;
  letter-spacing: 0.01em;
}

.cv-title {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.72);
  margin-bottom: 0.45rem;
}

.cv-contact {
  font-size: 0.85rem;
  margin-bottom: 0;
}

.cv-contact a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.cv-contact-sep {
  color: rgba(0, 0, 0, 0.55);
}
</style>
