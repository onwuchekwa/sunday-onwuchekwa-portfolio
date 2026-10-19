<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSiteSettings } from '@/composables/useSiteSettings'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
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
            <v-text-field v-model="settings.title" label="Title / Affiliation" required />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="settings.tagline"
              label="Site description"
              rows="3"
              hint="Used as the meta description for search engines and link previews. Your bio is edited under Home Page."
              persistent-hint
            />
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
              label="Phone"
              hint="Shown on your CV header"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.websiteUrl"
              label="Website URL"
              hint="Shown on your CV header (e.g. https://sunday-onwuchekwa.web.app)"
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
          Shown in the sidebar and footer. Icons use Material Design Icons names (e.g. mdi-school, mdi-linkedin).
        </p>
        <div v-for="(link, index) in settings.socialLinks" :key="index" class="mb-3">
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field v-model="link.platform" label="Platform" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="link.url" label="URL" />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field v-model="link.icon" label="Icon (mdi-*)" />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
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
