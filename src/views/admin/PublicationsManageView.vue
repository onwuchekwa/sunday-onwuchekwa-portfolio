<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useConfirm } from '@/composables/useConfirm'
import { useNotify } from '@/composables/useNotify'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { isSameAuthor, parseAuthorList } from '@/utils/authors'
import { extractDoi, fetchDoiDetails } from '@/utils/crossref'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AuthorList from '@/components/AuthorList.vue'
import { normalizeAuthors } from '@/utils/cvFormat'
import { PUBLICATION_THUMBNAIL_MAX_BYTES } from '@/utils/imageToBase64'
import {
  PUBLICATION_LINK_FIELDS,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPE_SCHEME,
  PUBLICATION_TYPES,
  publicationTypeLabel,
  resolvePublicationStatus,
  resolveVenueShort,
  type Publication,
  type PublicationLinks,
} from '@/types/content'

const { publications, load, create, update, remove, loading } = usePublications()
const { settings, load: loadSettings } = useSiteSettings()
const { confirm } = useConfirm()
const notify = useNotify()
const route = useRoute()
const router = useRouter()
const dialog = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

function emptyLinks(): Required<PublicationLinks> {
  return { pdf: '', doi: '', arxiv: '', slides: '', poster: '', video: '', code: '' }
}

const emptyForm = (): Omit<Publication, 'id'> => ({
  title: '',
  authors: [{ name: '', bold: false }],
  venue: '',
  venueShort: '',
  year: new Date().getFullYear(),
  type: 'full_paper',
  typeScheme: PUBLICATION_TYPE_SCHEME,
  status: 'published',
  abstract: '',
  links: emptyLinks(),
  featured: false,
  includeInCv: true,
  cvOrder: 0,
  cvStatus: '',
  acceptanceRate: '',
  scholarNote: '',
  isJournalModel: false,
  thumbnailUrl: '',
  sourceUrl: '',
  createdAt: new Date().toISOString(),
})

const form = ref(emptyForm())
const authorError = ref('')

/** Unsaved edits in the open dialog; closing it or leaving the page asks first. */
const {
  isDirty: formDirty,
  markSaved: markFormClean,
  confirmDiscard,
} = useUnsavedChanges(() => (dialog.value ? form.value : null))

function showDialog() {
  dialog.value = true
  markFormClean()
}

async function closeDialog() {
  if (!(await confirmDiscard())) return
  dialog.value = false
  markFormClean()
}

// ---- Fill from DOI ----
const doiInput = ref('')
const doiLoading = ref(false)
const doiResult = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

/** Authors as rows, with the site owner bolded. */
function toAuthorRows(names: string[]) {
  return names.map((name) => ({ name, bold: isSameAuthor(name, settings.value.name) }))
}

async function fillFromDoi() {
  doiResult.value = null
  const doi = extractDoi(doiInput.value)
  if (!doi) {
    doiResult.value = {
      kind: 'error',
      text: 'That doesn’t look like a DOI. Paste something like 10.1145/3584931.3607498 or a doi.org link.',
    }
    return
  }
  doiLoading.value = true
  try {
    const details = await fetchDoiDetails(doi)
    const filled: string[] = []
    if (details.title) {
      form.value.title = details.title
      filled.push('title')
    }
    if (details.authors.length) {
      form.value.authors = toAuthorRows(details.authors)
      filled.push(`${details.authors.length} authors`)
    }
    if (details.venue) {
      form.value.venue = details.venue
      filled.push('venue')
    }
    if (details.year) {
      form.value.year = details.year
      filled.push('year')
    }
    if (details.abstract && !form.value.abstract?.trim()) {
      form.value.abstract = details.abstract
      filled.push('abstract')
    }
    if (details.type) form.value.type = details.type
    form.value.links.doi = `https://doi.org/${doi}`
    if (!form.value.sourceUrl?.trim()) form.value.sourceUrl = `https://doi.org/${doi}`
    filled.push('DOI link')
    doiResult.value = {
      kind: 'success',
      text: `Filled in ${filled.join(', ')}. Check the type, status, and venue badge, which Crossref doesn’t provide.`,
    }
  } catch (e) {
    doiResult.value = { kind: 'error', text: e instanceof Error ? e.message : 'Lookup failed.' }
  } finally {
    doiLoading.value = false
  }
}

// ---- Paste authors ----
const pasteOpen = ref(false)
const pasteText = ref('')
const pastedNames = computed(() => parseAuthorList(pasteText.value))

function usePastedAuthors() {
  if (!pastedNames.value.length) return
  form.value.authors = toAuthorRows(pastedNames.value)
  authorError.value = ''
  pasteOpen.value = false
  pasteText.value = ''
}

const typeItems = PUBLICATION_TYPES.map((t) => ({ title: t.title, value: t.value, subtitle: t.hint }))

const venueBadgePreview = computed(() => resolveVenueShort(form.value))

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Year', key: 'year', width: 80 },
  { title: 'Type', key: 'type', width: 160 },
  { title: 'Status', key: 'status', width: 130 },
  { title: 'In CV', key: 'includeInCv', width: 80 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

onMounted(async () => {
  await Promise.all([load(), loadSettings()])
  // Dashboard "Add a publication" shortcut
  if (route.query.new) {
    router.replace({ query: {} })
    openCreate()
  }
})

function statusLabel(pub: Publication): string {
  const value = resolvePublicationStatus(pub)
  return PUBLICATION_STATUSES.find((s) => s.value === value)?.title ?? value
}

function resetHelpers(doi = '') {
  doiInput.value = doi
  doiResult.value = null
  pasteOpen.value = false
  pasteText.value = ''
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  authorError.value = ''
  resetHelpers()
  showDialog()
}

function openEdit(pub: Publication) {
  editingId.value = pub.id ?? null
  form.value = {
    title: pub.title,
    authors: normalizeAuthors(pub.authors).map((author) => ({ ...author })),
    venue: pub.venue,
    venueShort: pub.venueShort ?? '',
    year: pub.year,
    type: pub.type,
    typeScheme: PUBLICATION_TYPE_SCHEME,
    status: resolvePublicationStatus(pub),
    abstract: pub.abstract ?? '',
    links: { ...emptyLinks(), ...pub.links },
    featured: pub.featured,
    includeInCv: pub.includeInCv,
    cvOrder: pub.cvOrder,
    cvStatus: pub.cvStatus ?? '',
    acceptanceRate: pub.acceptanceRate ?? '',
    scholarNote: pub.scholarNote ?? '',
    isJournalModel: pub.isJournalModel ?? false,
    thumbnailUrl: pub.thumbnailUrl ?? '',
    sourceUrl: pub.sourceUrl ?? '',
    createdAt: pub.createdAt ?? new Date().toISOString(),
  }
  if (!form.value.authors.length) {
    form.value.authors.push({ name: '', bold: false })
  }
  authorError.value = ''
  resetHelpers(pub.links?.doi ?? '')
  showDialog()
}

function addAuthor() {
  form.value.authors.push({ name: '', bold: false })
}

function removeAuthor(index: number) {
  form.value.authors.splice(index, 1)
}

function moveAuthor(index: number, direction: -1 | 1) {
  const target = index + direction
  const authors = form.value.authors
  if (target < 0 || target >= authors.length) return
  ;[authors[index], authors[target]] = [authors[target], authors[index]]
}

async function handleSave() {
  const authors = normalizeAuthors(form.value.authors)
  if (!authors.length) {
    authorError.value = 'Add at least one author.'
    return
  }
  authorError.value = ''

  saving.value = true
  try {
    const links = Object.fromEntries(
      Object.entries(form.value.links).filter(([, url]) => url?.trim()),
    ) as PublicationLinks
    const payload = { ...form.value, authors, links, typeScheme: PUBLICATION_TYPE_SCHEME }
    if (editingId.value) {
      await update(editingId.value, payload)
      notify.success('Publication updated. It’s live now.')
    } else {
      await create(payload)
      notify.success('Publication added. It’s live now.')
    }
    dialog.value = false
    markFormClean()
  } catch (e) {
    notify.error('Couldn’t save the publication. Your edits are still here.', e)
  } finally {
    saving.value = false
  }
}

async function handleDelete(pub: Publication) {
  const ok = await confirm({
    title: 'Delete this publication?',
    message: `“${pub.title}” will be removed from your site and CV. This can’t be undone.`,
  })
  if (!ok || !pub.id) return
  try {
    await remove(pub.id)
    notify.success('Publication deleted.')
  } catch (e) {
    notify.error('Couldn’t delete the publication.', e)
  }
}

async function toggleCv(id: string, current: boolean) {
  try {
    await update(id, { includeInCv: !current })
    notify.success(current ? 'Removed from your CV.' : 'Added to your CV.')
  } catch (e) {
    notify.error('Couldn’t update the CV setting.', e)
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Publications"
      description="Shown on the Publications page, grouped by year or type. Toggle “In CV” to include one in your CV."
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add publication</v-btn>
      </template>
    </AdminPageHeader>

    <v-data-table
      :headers="headers"
      :items="publications"
      :loading="loading"
      class="admin-table"
    >
      <template #item.type="{ item }">
        {{ publicationTypeLabel(item.type) }}
      </template>
      <template #item.status="{ item }">
        {{ statusLabel(item) }}
      </template>
      <template #item.includeInCv="{ item }">
        <v-switch
          :model-value="item.includeInCv"
          hide-details
          density="compact"
          color="primary"
          @update:model-value="toggleCv(item.id!, item.includeInCv)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" aria-label="Edit publication" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" aria-label="Delete publication" @click="handleDelete(item)" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="760" persistent scrollable>
      <v-card class="admin-dialog">
        <v-card-title class="admin-dialog__title">
          {{ editingId ? 'Edit publication' : 'Add publication' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="admin-dialog__body">
        <v-form id="publication-form" @submit.prevent="handleSave">
          <div class="doi-fill mb-4">
            <div class="d-flex flex-wrap ga-2 align-start">
              <v-text-field
                v-model="doiInput"
                label="DOI or DOI link"
                placeholder="10.1145/… or https://doi.org/…"
                prepend-inner-icon="mdi-link-variant"
                density="comfortable"
                hide-details
                class="flex-grow-1"
                @keydown.enter.prevent="fillFromDoi"
              />
              <v-btn
                color="primary"
                variant="tonal"
                height="48"
                prepend-icon="mdi-auto-fix"
                :loading="doiLoading"
                :disabled="!doiInput.trim()"
                @click="fillFromDoi"
              >
                Fill details
              </v-btn>
            </div>
            <p v-if="!doiResult" class="doi-fill__hint">
              Paste the DOI and the title, authors, venue, year, and abstract fill in for you.
            </p>
            <v-alert
              v-else
              :type="doiResult.kind"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              {{ doiResult.text }}
            </v-alert>
          </div>

          <h3 class="admin-form-section">Basics</h3>
          <v-text-field v-model="form.title" label="Title" required class="mb-2" />
          <div class="mb-4">
            <h3 class="admin-form-section">Authors</h3>
            <div
              v-for="(author, index) in form.authors"
              :key="index"
              class="d-flex align-center ga-2 mb-2"
            >
              <v-text-field
                v-model="author.name"
                :label="`Author ${index + 1}`"
                density="compact"
                hide-details
                class="flex-grow-1"
              />
              <v-switch
                v-model="author.bold"
                label="Bold"
                color="primary"
                density="compact"
                hide-details
                class="flex-grow-0"
              />
              <v-btn
                icon="mdi-arrow-up"
                variant="text"
                size="small"
                :disabled="index === 0"
                aria-label="Move author up"
                @click="moveAuthor(index, -1)"
              />
              <v-btn
                icon="mdi-arrow-down"
                variant="text"
                size="small"
                :disabled="index === form.authors.length - 1"
                aria-label="Move author down"
                @click="moveAuthor(index, 1)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                :disabled="form.authors.length === 1"
                aria-label="Remove author"
                @click="removeAuthor(index)"
              />
            </div>
            <div class="d-flex flex-wrap ga-2">
              <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addAuthor">
                Add author
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-content-paste"
                @click="pasteOpen = !pasteOpen"
              >
                Paste a list
              </v-btn>
            </div>
            <div v-if="pasteOpen" class="author-paste mt-3">
              <v-textarea
                v-model="pasteText"
                label="Paste the author list"
                placeholder="Sunday O. Onwuchekwa, Spencer Taylor, and Amanda Lee Hughes"
                rows="2"
                auto-grow
                autofocus
                hide-details
              />
              <div class="d-flex flex-wrap align-center justify-space-between ga-2 mt-2">
                <span class="text-body-2 text-medium-emphasis">
                  {{ pastedNames.length ? `${pastedNames.length} authors found. Your name is bolded automatically.` : 'Commas, “and”, semicolons, or one per line all work.' }}
                </span>
                <v-btn
                  color="primary"
                  size="small"
                  variant="flat"
                  :disabled="!pastedNames.length"
                  @click="usePastedAuthors"
                >
                  Replace authors
                </v-btn>
              </div>
            </div>
            <p class="text-body-2 text-medium-emphasis mt-3 mb-0">
              Preview: <AuthorList :authors="form.authors" />
            </p>
            <p v-if="authorError" class="text-error text-body-2 mt-1 mb-0">{{ authorError }}</p>
          </div>
          <v-text-field
            v-model="form.venue"
            label="Venue (full name)"
            hint="e.g. Companion of the 2026 ACM Conference on Computer-Supported Cooperative Work"
            persistent-hint
            required
            class="mb-4"
          />
          <v-text-field
            v-model="form.venueShort"
            label="Venue badge"
            :placeholder="venueBadgePreview || `CHI '26`"
            hint="Short label shown as a badge, e.g. CHI '26, CSCW '26 Companion, CHI '26 Workshop"
            persistent-hint
            class="mb-4"
          />
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="form.year" label="Year" type="number" required />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select v-model="form.type" :items="typeItems" label="Type">
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :subtitle="item.subtitle" />
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select v-model="form.status" :items="PUBLICATION_STATUSES" label="Status" />
            </v-col>
          </v-row>
          <v-textarea v-model="form.abstract" label="Abstract" rows="3" auto-grow class="mb-2" />
          <h3 class="admin-form-section">Links</h3>
          <v-row dense>
            <v-col v-for="field in PUBLICATION_LINK_FIELDS" :key="field.key" cols="12" sm="6">
              <v-text-field
                v-model="form.links[field.key]"
                :label="`${field.label} URL`"
                :prepend-inner-icon="field.icon"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="form.sourceUrl"
            label="Source page URL"
            hint="ACM DL, DOI landing page, or project site — used for title/thumbnail links"
            persistent-hint
            class="mb-2"
          />

          <h3 class="admin-form-section">Thumbnail</h3>
          <ImageUploadField
            :model-value="form.thumbnailUrl ?? ''"
            label="Publication thumbnail"
            :max-dimension="480"
            :max-bytes="PUBLICATION_THUMBNAIL_MAX_BYTES"
            hint="Upload a preview image from the paper page, or paste an external image URL below."
            class="mb-2"
            @update:model-value="form.thumbnailUrl = $event"
          />
          <v-text-field
            v-model="form.thumbnailUrl"
            label="Or paste thumbnail image URL"
            hint="Direct link to og:image or figure preview from the publication site"
            persistent-hint
            class="mb-2"
          />

          <h3 class="admin-form-section">CV &amp; home page</h3>

          <v-text-field
            v-model="form.cvStatus"
            label="CV status (optional)"
            hint='e.g. "Accepted, forthcoming at CSCW 2026"'
            persistent-hint
            class="mb-2"
          />
          <v-text-field
            v-model="form.acceptanceRate"
            label="Acceptance rate (optional)"
            hint='e.g. "25.1% acceptance rate"'
            persistent-hint
            class="mb-2"
          />
          <v-text-field
            v-model="form.scholarNote"
            label="Scholar note (optional)"
            hint='e.g. "#1 in Google Scholar"'
            persistent-hint
            class="mb-2"
          />

          <v-row>
            <v-col cols="12" sm="5">
              <v-switch
                v-model="form.featured"
                label="Featured on home"
                hint="Up to 2 featured papers show under Selected Publications"
                persistent-hint
                color="primary"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-switch v-model="form.includeInCv" label="Include in CV" color="primary" />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field v-model.number="form.cvOrder" label="CV order" type="number" />
            </v-col>
          </v-row>
        </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="admin-dialog__actions">
          <span v-if="formDirty" class="dialog-unsaved">Unsaved changes</span>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn type="submit" form="publication-form" color="primary" variant="flat" :loading="saving">
            Save publication
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.doi-fill {
  padding: 1rem;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px dashed rgba(var(--v-theme-primary), 0.2);
}

.doi-fill__hint {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-body);
}

.author-paste {
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.03);
}

.dialog-unsaved {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a35f00;
}
</style>
