<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import SocialIcon from '@/components/SocialIcon.vue'
import { buildSiteTitle } from '@/utils/siteHead'
import UnsavedChangesBar from '@/components/admin/UnsavedChangesBar.vue'
import { useNotify } from '@/composables/useNotify'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import {
  estimateDocumentSize,
  FIRESTORE_DOC_LIMIT_BYTES,
  PROFILE_IMAGE_MAX_BYTES,
} from '@/utils/imageToBase64'
import { defaultSiteSettings, PUBLIC_PAGES } from '@/types/content'

const { settings, load, save, loading } = useSiteSettings()
const notify = useNotify()
const saving = ref(false)
const error = ref<string | null>(null)

const { isDirty, markSaved } = useUnsavedChanges(() => settings.value)

async function loadAll() {
  await load()
  markSaved()
}

onMounted(loadAll)

/** Roughly what Google shows: it cuts titles near 60 characters and descriptions near 160. */
const DESCRIPTION_LIMIT = 160
const searchTitle = computed(() => truncate(buildSiteTitle(settings.value), 62))
const searchDescription = computed(() => truncate(settings.value.tagline ?? '', DESCRIPTION_LIMIT))
const descriptionLength = computed(() => (settings.value.tagline ?? '').trim().length)
const descriptionAdvice = computed(() => {
  const n = descriptionLength.value
  if (!n) return 'Add a sentence or two about who you are and what you study.'
  if (n < 80) return 'A bit short. Mention your role, institution, and research topic.'
  if (n > DESCRIPTION_LIMIT) return `Google will cut this off after about ${DESCRIPTION_LIMIT} characters, as shown above.`
  return 'Good length.'
})

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`
}

function addSocialLink() {
  settings.value.socialLinks.push({ platform: '', url: '', icon: 'mdi-link' })
}

function removeSocialLink(index: number) {
  settings.value.socialLinks.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    const docSize = estimateDocumentSize({ ...settings.value })
    if (docSize > FIRESTORE_DOC_LIMIT_BYTES) {
      throw new Error(
        `Document too large (${Math.round(docSize / 1024)} KB). Use a smaller profile photo.`,
      )
    }
    await save({
      ...defaultSiteSettings(),
      ...settings.value,
      profileImageUrl: settings.value.profileImageUrl ?? '',
      websiteUrl: settings.value.websiteUrl ?? '',
      phone: settings.value.phone ?? '',
      pageVisibility: { ...defaultSiteSettings().pageVisibility, ...settings.value.pageVisibility },
    })
    markSaved()
    notify.success('Settings saved. They’re live now.')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
    notify.error('Couldn’t save your settings.', e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Site Settings"
      description="Your name, photo, contact details, profile links, and which pages are public."
    >
      <template #actions>
        <v-btn type="submit" form="settings-form" color="primary" prepend-icon="mdi-content-save" :loading="saving">
          Save settings
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-form id="settings-form" @submit.prevent="handleSave">
    <v-card class="pa-6 mb-4">
        <h2 class="admin-card-title">Profile</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.name" label="Full name" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.title"
              label="Role line"
              hint="Above your home page headline and in search results. Separate parts with |, e.g. PhD Student | HCI Researcher | Brigham Young University"
              persistent-hint
              required
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="settings.tagline"
              label="Site description"
              rows="2"
              auto-grow
              :counter="DESCRIPTION_LIMIT"
              persistent-counter
              :hint="descriptionAdvice"
              persistent-hint
            />
            <div class="search-preview" aria-label="Search result preview">
              <span class="search-preview__label">How you appear in Google</span>
              <span class="search-preview__url">sundayonwuchekwa.com</span>
              <span class="search-preview__title">{{ searchTitle }}</span>
              <span class="search-preview__description">
                {{ searchDescription || 'Your site description appears here.' }}
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <ImageUploadField
              v-model="settings.profileImageUrl"
              label="Profile photo"
              :max-dimension="400"
              :max-bytes="PROFILE_IMAGE_MAX_BYTES"
              crop-mode="portrait-face"
              hint="Large originals are auto-cropped to center your face, then compressed for Firestore."
            />
          </v-col>
        </v-row>
    </v-card>

    <v-card class="pa-6 mb-4">
        <h2 class="admin-card-title">Contact &amp; location</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="settings.email" label="Email" type="email" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.phone"
              label="Phone (private)"
              hint="Kept for your records only; it isn’t shown on your site or CV."
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.affiliation"
              label="Affiliation"
              hint="Shown in the sidebar, e.g. Brigham Young University"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.location"
              label="Location"
              hint="Shown in the sidebar, e.g. Provo, Utah"
              persistent-hint
            />
          </v-col>
        </v-row>
    </v-card>

    <v-card class="pa-6 mb-4">
        <h2 class="admin-card-title">Page visibility</h2>
        <p class="text-body-2 text-body-readable mb-3">
          Hidden pages are removed from the menu and show a 404 page to visitors. Pages that are
          visible but have no content yet show an "under construction" message.
        </p>
        <v-row class="mb-2">
          <v-col v-for="page in PUBLIC_PAGES" :key="page.id" cols="12" sm="4">
            <v-switch
              v-model="settings.pageVisibility[page.id]"
              :label="page.title"
              color="primary"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>

    </v-card>

    <v-card class="pa-6 mb-4">
        <h2 class="admin-card-title">Profile links</h2>
        <p class="text-body-2 text-body-readable mb-3">
          Shown in the sidebar and footer. Google Scholar, ORCID, LinkedIn, ResearchGate, and GitHub
          get their logos automatically from the link.
        </p>
        <div v-for="(link, index) in settings.socialLinks" :key="index" class="mb-3">
          <v-row align="center">
            <v-col cols="auto" class="social-preview">
              <SocialIcon :link="link" :size="22" />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model="link.platform" label="Name shown" placeholder="Google Scholar" hide-details />
            </v-col>
            <v-col>
              <v-text-field v-model="link.url" label="Link" placeholder="https://" hide-details />
            </v-col>
            <v-col cols="auto" class="d-flex align-center">
              <v-btn icon="mdi-delete" variant="text" color="error" aria-label="Remove link" @click="removeSocialLink(index)" />
            </v-col>
          </v-row>
        </div>
        <v-btn variant="tonal" prepend-icon="mdi-plus" @click="addSocialLink">
          Add link
        </v-btn>
    </v-card>
    </v-form>

    <UnsavedChangesBar :show="isDirty" :saving="saving" @save="handleSave" @discard="loadAll" />
  </div>
</template>

<style scoped>
.search-preview {
  display: grid;
  gap: 0.125rem;
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  background: #ffffff;
  font-family: Arial, sans-serif;
}

.search-preview__label {
  margin-bottom: 0.5rem;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.search-preview__url {
  font-size: 0.8125rem;
  color: #202124;
}

.search-preview__title {
  font-size: 1.25rem;
  line-height: 1.3;
  color: #1a0dab;
}

.search-preview__description {
  font-size: 0.875rem;
  line-height: 1.55;
  color: #4d5156;
}

.social-preview {
  color: var(--text-muted);
}
</style>
