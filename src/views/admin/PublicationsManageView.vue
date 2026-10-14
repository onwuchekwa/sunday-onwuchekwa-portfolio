<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePublications } from '@/composables/usePublications'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AuthorList from '@/components/AuthorList.vue'
import { normalizeAuthors } from '@/utils/cvFormat'
import { PUBLICATION_THUMBNAIL_MAX_BYTES } from '@/utils/imageToBase64'
import {
  defaultCvCategoryForType,
  PUBLICATION_CV_CATEGORIES,
  PUBLICATION_LINK_FIELDS,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPE_SCHEME,
  PUBLICATION_TYPES,
  publicationTypeLabel,
  resolvePublicationCvCategory,
  resolvePublicationStatus,
  resolveVenueShort,
  type Publication,
  type PublicationLinks,
} from '@/types/content'

const { publications, load, create, update, remove, loading } = usePublications()
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
  cvCategory: '',
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

const typeItems = PUBLICATION_TYPES.map((t) => ({ title: t.title, value: t.value, subtitle: t.hint }))

const autoCvCategoryTitle = computed(() => {
  const auto = defaultCvCategoryForType(form.value.type, form.value.status)
  return PUBLICATION_CV_CATEGORIES.find((c) => c.value === auto)?.title ?? ''
})

const cvCategoryItems = computed(() => [
  { title: `Automatic — ${autoCvCategoryTitle.value}`, value: '' },
  ...PUBLICATION_CV_CATEGORIES.map((c) => ({ title: c.title, value: c.value })),
])

const venueBadgePreview = computed(() => resolveVenueShort(form.value))

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Year', key: 'year', width: 80 },
  { title: 'Type', key: 'type', width: 160 },
  { title: 'Status', key: 'status', width: 130 },
  { title: 'CV section', key: 'cvCategory', width: 200 },
  { title: 'In CV', key: 'includeInCv', width: 80 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

onMounted(load)

function categoryLabel(pub: Publication): string {
  const value = resolvePublicationCvCategory(pub)
  return PUBLICATION_CV_CATEGORIES.find((c) => c.value === value)?.title ?? value
}

function statusLabel(pub: Publication): string {
  const value = resolvePublicationStatus(pub)
  return PUBLICATION_STATUSES.find((s) => s.value === value)?.title ?? value
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  authorError.value = ''
  dialog.value = true
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
    cvCategory: pub.cvCategory ?? '',
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
  dialog.value = true
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
    } else {
      await create(payload)
    }
    dialog.value = false
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (confirm('Delete this publication?')) {
    await remove(id)
  }
}

async function toggleCv(id: string, current: boolean) {
  await update(id, { includeInCv: !current })
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">Publications</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add publication</v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="publications"
      :loading="loading"
      class="elevation-1 rounded-lg"
    >
      <template #item.type="{ item }">
        {{ publicationTypeLabel(item.type) }}
      </template>
      <template #item.status="{ item }">
        {{ statusLabel(item) }}
      </template>
      <template #item.cvCategory="{ item }">
        {{ categoryLabel(item) }}
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
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="handleDelete(item.id!)" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="720" persistent scrollable>
      <v-card class="pa-6">
        <h2 class="text-h6 font-weight-bold mb-4">
          {{ editingId ? 'Edit' : 'Add' }} Publication
        </h2>
        <v-form @submit.prevent="handleSave">
          <v-text-field v-model="form.title" label="Title" required class="mb-2" />
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Authors</h3>
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
            <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addAuthor">
              Add author
            </v-btn>
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
          <v-textarea v-model="form.abstract" label="Abstract" rows="3" class="mb-2" />
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Links</h3>
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

          <v-divider class="my-4" />
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Thumbnail</h3>
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

          <v-divider class="my-4" />
          <h3 class="text-subtitle-1 font-weight-bold mb-3">CV formatting</h3>

          <v-select
            v-model="form.cvCategory"
            :items="cvCategoryItems"
            item-title="title"
            item-value="value"
            label="CV section"
            hint="Automatic picks the CV section from the type and status"
            persistent-hint
            class="mb-4"
          />
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
          <v-switch
            v-model="form.isJournalModel"
            label="Journal-model conference (shows ᐩ marker)"
            color="primary"
            class="mb-2"
          />

          <v-row>
            <v-col cols="4">
              <v-switch v-model="form.featured" label="Featured" color="primary" />
            </v-col>
            <v-col cols="4">
              <v-switch v-model="form.includeInCv" label="Include in CV" color="primary" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="form.cvOrder" label="CV order" type="number" />
            </v-col>
          </v-row>
          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
            <v-btn type="submit" color="primary" :loading="saving">Save</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
