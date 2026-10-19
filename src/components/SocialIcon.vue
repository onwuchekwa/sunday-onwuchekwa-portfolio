<script setup lang="ts">
import { computed } from 'vue'
import { siGithub, siGooglescholar, siOrcid, siResearchgate } from 'simple-icons'
import type { SocialLink } from '@/types/content'

const props = withDefaults(defineProps<{ link: SocialLink; size?: number }>(), { size: 18 })

/** Academic profiles get their real marks; anything else uses the link's own "mdi-*" icon. */
const BRANDS = [
  { match: /scholar\.google|google scholar/i, icon: siGooglescholar },
  { match: /orcid/i, icon: siOrcid },
  { match: /researchgate/i, icon: siResearchgate },
  { match: /github/i, icon: siGithub },
]

const brand = computed(
  () => BRANDS.find(({ match }) => match.test(props.link.url) || match.test(props.link.platform))?.icon,
)
</script>

<template>
  <svg
    v-if="brand"
    class="social-icon"
    :width="size"
    :height="size"
    viewBox="-2 -2 28 28"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="brand.path" fill="currentColor" />
  </svg>
  <v-icon v-else :icon="link.icon || 'mdi-link-variant'" :size="size" />
</template>

<style scoped>
.social-icon {
  flex-shrink: 0;
}
</style>
