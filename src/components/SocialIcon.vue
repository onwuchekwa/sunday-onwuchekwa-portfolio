<script setup lang="ts">
import { computed } from 'vue'
import { siGithub, siGooglescholar, siOrcid, siResearchgate } from 'simple-icons'
import type { SocialLink } from '@/types/content'

const props = withDefaults(defineProps<{ link: SocialLink; size?: number }>(), { size: 18 })

/** Academic profiles get their real marks; others get an icon guessed from the link. */
const BRANDS = [
  { match: /scholar\.google|google scholar/i, icon: siGooglescholar },
  { match: /orcid/i, icon: siOrcid },
  { match: /researchgate/i, icon: siResearchgate },
  { match: /github/i, icon: siGithub },
]

/** Common sites whose icon the link itself implies, so nobody has to type an icon name. */
const MDI_GUESSES = [
  { match: /linkedin/i, icon: 'mdi-linkedin' },
  { match: /twitter\.com|\/\/x\.com/i, icon: 'mdi-twitter' },
  { match: /^mailto:/i, icon: 'mdi-email-outline' },
]

const fallbackIcon = computed(
  () =>
    MDI_GUESSES.find(({ match }) => match.test(props.link.url))?.icon ??
    (props.link.icon && props.link.icon !== 'mdi-link' ? props.link.icon : 'mdi-link-variant'),
)

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
  <v-icon v-else :icon="fallbackIcon" :size="size" />
</template>

<style scoped>
.social-icon {
  flex-shrink: 0;
}
</style>
