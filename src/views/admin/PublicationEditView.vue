<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useNotify } from '@/composables/useNotify'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { isSameAuthor, parseAuthorList } from '@/utils/authors'
import { extractDoi, fetchDoiDetails } from '@/utils/crossref'
import { normalizeAuthors } from '@/utils/cvFormat'
import { PUBLICATION_THUMBNAIL_MAX_BYTES } from '@/utils/imageToBase64'
import { pdfPageToThumbnail, readablePdfUrl, type PdfCrop } from '@/utils/pdfThumbnail'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import PublicationCard from '@/components/PublicationCard.vue'
import {
  PUBLICATION_LINK_FIELDS,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPE_SCHEME,
  PUBLICATION_TYPES,
  resolvePublicationStatus,
  resolveVenueShort,
  type Publication,
  type PublicationLinks,
} from '@/types/content'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const { publications, load, create, update } = usePublications()
const { settings, load: loadSettings } = useSiteSettings()

/** Undefined on /publications/new. */
const editingId = computed(() => (route.params.id as string | undefined) ?? null)
const loading = ref(true)
const notFound = ref(false)
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
const titleError = ref('')

const { isDirty, markSaved } = useUnsavedChanges(() => form.value)

const typeItems = PUBLICATION_TYPES.map((t) => ({ title: t.title, value: t.value, subtitle: t.hint }))
const venueBadgePreview = computed(() => resolveVenueShort(form.value))

onMounted(async () => {
  await Promise.all([load(), loadSettings()])
  if (editingId.value) {
    const pub = publications.value.find((p) => p.id === editingId.value)
    if (!pub) {
      notFound.value = true
    } else {
      form.value = {
        ...emptyForm(),
        ...pub,
        authors: normalizeAuthors(pub.authors).map((author) => ({ ...author })),
        venueShort: pub.venueShort ?? '',
        typeScheme: PUBLICATION_TYPE_SCHEME,
        status: resolvePublicationStatus(pub),
        abstract: pub.abstract ?? '',
        links: { ...emptyLinks(), ...pub.links },
        cvStatus: pub.cvStatus ?? '',
        acceptanceRate: pub.acceptanceRate ?? '',
        scholarNote: pub.scholarNote ?? '',
        isJournalModel: pub.isJournalModel ?? false,
        thumbnailUrl: pub.thumbnailUrl ?? '',
        sourceUrl: pub.sourceUrl ?? '',
        createdAt: pub.createdAt ?? new Date().toISOString(),
      }
      delete (form.value as Partial<Publication>).id
      if (!form.value.authors.length) form.value.authors.push({ name: '', bold: false })
      doiInput.value = pub.links?.doi ?? ''
    }
  }
  loading.value = false
  markSaved()
})

// ---- Live preview: exactly what the public card renders ----
const previewPublication = computed<Publication>(() => ({
  ...form.value,
  id: 'preview',
  title: form.value.title.trim() || 'Your paper’s title',
  authors: normalizeAuthors(form.value.authors).length
    ? normalizeAuthors(form.value.authors)
    : [{ name: settings.value.name || 'You', bold: true }],
  links: Object.fromEntries(
    Object.entries(form.value.links).filter(([, url]) => url?.trim()),
  ) as PublicationLinks,
}))
const previewAbstractOpen = ref(true)

const placements = computed(() => {
  const list = ['Publications page']
  if (form.value.featured) list.push('Home page (Selected Publications)')
  if (form.value.includeInCv) list.push('CV')
  return list
})

// ---- Sections, for the jump links ----
const SECTIONS = [
  { id: 'pub-basics', title: 'Basics' },
  { id: 'pub-authors', title: 'Authors' },
  { id: 'pub-venue', title: 'Venue & type' },
  { id: 'pub-links', title: 'Links' },
  { id: 'pub-thumbnail', title: 'Thumbnail' },
  { id: 'pub-placement', title: 'Where it shows' },
]

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---- Authors ----
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

/** Authors as rows, with the site owner bolded. */
function toAuthorRows(names: string[]) {
  return names.map((name) => ({ name, bold: isSameAuthor(name, settings.value.name) }))
}

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

// ---- Fill from DOI ----
const doiInput = ref('')
const doiLoading = ref(false)
const doiResult = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

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
    titleError.value = ''
    authorError.value = ''
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

// ---- Thumbnail from the paper's PDF ----
const pdfPage = ref(1)
const pdfCrop = ref<PdfCrop>('top')
const pdfBusy = ref(false)
const pdfError = ref('')
const pdfPageCount = ref<number | null>(null)
const pdfFileInput = ref<HTMLInputElement | null>(null)
/** A PDF or poster link on this site can be read directly; others need the file. */
const sitePdfUrl = computed(
  () => readablePdfUrl(form.value.links.pdf ?? '') ?? readablePdfUrl(form.value.links.poster ?? ''),
)

async function makeThumbnail(source: File | string) {
  pdfBusy.value = true
  pdfError.value = ''
  try {
    const result = await pdfPageToThumbnail(source, {
      page: pdfPage.value,
      crop: pdfCrop.value,
      maxDimension: 480,
      maxBytes: PUBLICATION_THUMBNAIL_MAX_BYTES,
    })
    form.value.thumbnailUrl = result.dataUrl
    pdfPageCount.value = result.pageCount
  } catch (e) {
    pdfError.value = e instanceof Error ? e.message : 'Couldn’t make a thumbnail from that PDF.'
  } finally {
    pdfBusy.value = false
  }
}

function onPdfChosen(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void makeThumbnail(file)
  ;(event.target as HTMLInputElement).value = ''
}

// ---- Save ----
function backToList() {
  router.push({ name: 'admin-publications' })
}

async function handleSave() {
  titleError.value = form.value.title.trim() ? '' : 'Add a title.'
  const authors = normalizeAuthors(form.value.authors)
  authorError.value = authors.length ? '' : 'Add at least one author.'
  if (titleError.value || authorError.value) {
    jumpTo(titleError.value ? 'pub-basics' : 'pub-authors')
    return
  }

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
    markSaved()
    backToList()
  } catch (e) {
    notify.error('Couldn’t save the publication. Your edits are still here.', e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="pub-editor">
    <header class="pub-editor__header">
      <div class="min-w-0">
        <router-link :to="{ name: 'admin-publications' }" class="pub-editor__back">
          <v-icon icon="mdi-arrow-left" size="16" /> All publications
        </router-link>
        <h1 class="pub-editor__title">{{ editingId ? 'Edit publication' : 'Add a publication' }}</h1>
      </div>
      <div class="d-flex align-center flex-wrap ga-2">
        <span v-if="isDirty" class="pub-editor__unsaved">Unsaved changes</span>
        <v-btn variant="text" @click="backToList">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="saving"
          :disabled="loading || notFound"
          @click="handleSave"
        >
          {{ editingId ? 'Save changes' : 'Add publication' }}
        </v-btn>
      </div>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-alert v-else-if="notFound" type="warning" variant="tonal">
      This publication doesn’t exist anymore. It may have been deleted.
      <router-link :to="{ name: 'admin-publications' }">Back to all publications</router-link>.
    </v-alert>

    <div v-else class="pub-editor__layout">
      <!-- ================= Form ================= -->
      <div class="pub-editor__form">
        <nav class="pub-editor__jump" aria-label="Form sections">
          <button v-for="section in SECTIONS" :key="section.id" type="button" @click="jumpTo(section.id)">
            {{ section.title }}
          </button>
        </nav>

        <v-form @submit.prevent="handleSave">
          <!-- Basics -->
          <section id="pub-basics" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Basics</h2>
            <div class="doi-fill mb-5">
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
                Already has a DOI? Paste it and the title, authors, venue, year, and abstract fill in for you.
              </p>
              <v-alert v-else :type="doiResult.kind" variant="tonal" density="compact" class="mt-2">
                {{ doiResult.text }}
              </v-alert>
            </div>

            <v-textarea
              v-model="form.title"
              label="Title"
              rows="1"
              auto-grow
              :error-messages="titleError"
              class="mb-2"
              @update:model-value="titleError = ''"
            />
            <v-textarea
              v-model="form.abstract"
              label="Abstract (optional)"
              rows="3"
              auto-grow
              hint="Visitors can expand it under the paper on your Publications page."
              persistent-hint
            />
          </section>

          <!-- Authors -->
          <section id="pub-authors" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Authors</h2>
            <p class="pub-editor__help">In byline order. Bold marks you (and anyone you want to highlight).</p>
            <div v-for="(author, index) in form.authors" :key="index" class="author-row">
              <v-text-field
                v-model="author.name"
                :label="`Author ${index + 1}`"
                density="compact"
                hide-details
                class="flex-grow-1"
              />
              <v-btn
                :variant="author.bold ? 'flat' : 'text'"
                :color="author.bold ? 'primary' : undefined"
                size="small"
                icon="mdi-format-bold"
                :aria-pressed="author.bold"
                :aria-label="author.bold ? 'Bolded' : 'Bold this name'"
                :title="author.bold ? 'Bolded' : 'Bold this name'"
                @click="author.bold = !author.bold"
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
            <div class="d-flex flex-wrap ga-2 mt-1">
              <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addAuthor">Add author</v-btn>
              <v-btn variant="text" size="small" prepend-icon="mdi-content-paste" @click="pasteOpen = !pasteOpen">
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
                  {{
                    pastedNames.length
                      ? `${pastedNames.length} authors found. Your name is bolded automatically.`
                      : 'Commas, “and”, semicolons, or one per line all work.'
                  }}
                </span>
                <v-btn color="primary" size="small" variant="flat" :disabled="!pastedNames.length" @click="usePastedAuthors">
                  Replace authors
                </v-btn>
              </div>
            </div>
            <p v-if="authorError" class="text-error text-body-2 mt-2 mb-0">{{ authorError }}</p>
          </section>

          <!-- Venue & type -->
          <section id="pub-venue" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Venue &amp; type</h2>
            <v-text-field
              v-model="form.venue"
              label="Venue (full name)"
              hint="e.g. Companion of the 2026 ACM Conference on Computer-Supported Cooperative Work"
              persistent-hint
              class="mb-4"
            />
            <v-text-field
              v-model="form.venueShort"
              label="Venue badge"
              :placeholder="venueBadgePreview || `CHI '26`"
              hint="The short label on the badge, e.g. CHI '26 or CSCW '26 Companion. Leave empty to use the suggestion."
              persistent-hint
              class="mb-4"
            />
            <v-row dense>
              <v-col cols="12" sm="3">
                <v-text-field v-model.number="form.year" label="Year" type="number" />
              </v-col>
              <v-col cols="12" sm="5">
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
          </section>

          <!-- Links -->
          <section id="pub-links" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Links</h2>
            <p class="pub-editor__help">Each link becomes a button under the paper. Leave the rest empty.</p>
            <v-row dense>
              <v-col v-for="field in PUBLICATION_LINK_FIELDS" :key="field.key" cols="12" sm="6">
                <v-text-field
                  v-model="form.links[field.key]"
                  :label="field.label"
                  placeholder="https://"
                  :prepend-inner-icon="field.icon"
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <v-text-field
              v-model="form.sourceUrl"
              label="Paper page (optional)"
              hint="Where the title links: the ACM DL page, DOI page, or a project site. Defaults to the DOI or PDF."
              persistent-hint
            />
          </section>

          <!-- Thumbnail -->
          <section id="pub-thumbnail" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Thumbnail</h2>
            <p class="pub-editor__help">
              A key figure from the paper or a crop of the poster. Landscape images work best;
              the whole image is shown. Hidden on phones.
            </p>
            <div class="pdf-thumb mb-4">
              <p class="pdf-thumb__title">Make one from the paper’s PDF</p>
              <div class="d-flex flex-wrap align-center ga-3">
                <v-text-field
                  v-model.number="pdfPage"
                  label="Page"
                  type="number"
                  min="1"
                  density="compact"
                  hide-details
                  class="pdf-thumb__page"
                />
                <v-btn-toggle v-model="pdfCrop" mandatory density="compact" variant="outlined" divided>
                  <v-btn value="top" size="small">Top of page</v-btn>
                  <v-btn value="full" size="small">Whole page</v-btn>
                </v-btn-toggle>
              </div>
              <div class="d-flex flex-wrap ga-2 mt-3">
                <v-btn
                  v-if="sitePdfUrl"
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-file-pdf-box"
                  :loading="pdfBusy"
                  @click="makeThumbnail(sitePdfUrl!)"
                >
                  Use the linked PDF
                </v-btn>
                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-file-document-outline"
                  :loading="pdfBusy && !sitePdfUrl"
                  @click="pdfFileInput?.click()"
                >
                  Choose a PDF file…
                </v-btn>
                <input ref="pdfFileInput" type="file" accept="application/pdf,.pdf" hidden @change="onPdfChosen" />
              </div>
              <p class="pdf-thumb__hint">
                “Top of page” keeps the title and the figure under it, which is usually the most
                recognizable part. Try page 2 or 3 for a figure.
                <template v-if="pdfPageCount"> This PDF has {{ pdfPageCount }} pages.</template>
              </p>
              <v-alert v-if="pdfError" type="error" variant="tonal" density="compact" class="mt-2">{{ pdfError }}</v-alert>
            </div>

            <ImageUploadField
              :model-value="form.thumbnailUrl ?? ''"
              label="Thumbnail image"
              :max-dimension="480"
              :max-bytes="PUBLICATION_THUMBNAIL_MAX_BYTES"
              hint="Or upload an image of your own."
              class="mb-2"
              @update:model-value="form.thumbnailUrl = $event"
            />
          </section>

          <!-- Placement -->
          <section id="pub-placement" class="pub-editor__section">
            <h2 class="pub-editor__section-title">Where it shows</h2>
            <v-switch
              v-model="form.featured"
              label="Feature on the home page"
              hint="Featured papers come first under Selected Publications (2 shown)."
              persistent-hint
              color="primary"
              class="mb-3"
            />
            <v-switch
              v-model="form.includeInCv"
              label="Include in my CV"
              color="primary"
              hide-details
              class="mb-3"
            />
            <p v-if="form.includeInCv" class="pub-editor__help mt-1 mb-0">
              To change where it sits in your CV, use <strong>Order in CV</strong> on the Publications page.
            </p>
          </section>
        </v-form>
      </div>

      <!-- ================= Preview ================= -->
      <aside class="pub-editor__preview" aria-label="Preview">
        <div class="preview-panel">
          <div class="preview-panel__head">
            <span class="preview-panel__label">Live preview</span>
            <v-btn
              v-if="form.abstract?.trim()"
              size="x-small"
              variant="text"
              @click="previewAbstractOpen = !previewAbstractOpen"
            >
              {{ previewAbstractOpen ? 'Hide abstract' : 'Show abstract' }}
            </v-btn>
          </div>
          <div class="preview-panel__page">
            <PublicationCard
              :key="previewAbstractOpen ? 'open' : 'closed'"
              :publication="previewPublication"
              :show-abstract="false"
            />
            <p v-if="previewAbstractOpen && form.abstract?.trim()" class="preview-panel__abstract">
              {{ form.abstract }}
            </p>
          </div>
          <div class="preview-panel__where">
            <span class="preview-panel__label">Appears on</span>
            <ul>
              <li v-for="place in placements" :key="place">
                <v-icon icon="mdi-check-circle" size="16" /> {{ place }}
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pub-editor__header {
  position: sticky;
  top: var(--v-layout-top, 60px);
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  margin: -1rem -1rem 1.5rem;
  padding: 1rem 1rem 0.875rem;
  background: rgb(var(--v-theme-background));
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

@media (min-width: 960px) {
  .pub-editor__header {
    margin: -2rem -2rem 1.75rem;
    padding: 1.25rem 2rem 1rem;
  }
}

.pub-editor__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary)) !important;
  text-decoration: none;
}

.pub-editor__back:hover {
  text-decoration: underline;
}

.pub-editor__title {
  margin: 0.25rem 0 0;
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--byu-navy);
}

.pub-editor__unsaved {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a35f00;
}

/* Form on the left, preview beside it on wide screens. */
.pub-editor__layout {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 1200px) {
  .pub-editor__layout {
    grid-template-columns: minmax(0, 1fr) 420px;
    align-items: start;
  }

  .pub-editor__preview {
    position: sticky;
    top: calc(var(--v-layout-top, 60px) + 6.5rem);
  }
}

@media (max-width: 1199.98px) {
  /* Narrower screens: preview first, so changes are visible without scrolling to the end. */
  .pub-editor__preview {
    order: -1;
  }
}

.pub-editor__jump {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.pub-editor__jump button {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  background: #ffffff;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-body);
  cursor: pointer;
}

.pub-editor__jump button:hover {
  border-color: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-secondary));
}

.pub-editor__section {
  scroll-margin-top: calc(var(--v-layout-top, 60px) + 6rem);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: #ffffff;
}

.pub-editor__section-title {
  margin: 0 0 1rem;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--byu-navy);
}

.pub-editor__help {
  margin: -0.5rem 0 1rem;
  font-size: 0.875rem;
  color: var(--text-body);
}

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

.pdf-thumb {
  padding: 1rem;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.pdf-thumb__title {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--byu-navy);
}

.pdf-thumb__page {
  max-width: 6rem;
}

.pdf-thumb__hint {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-body);
}

.author-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.author-paste {
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.03);
}

/* The preview sits on the site's paper background so it reads like the real page. */
.preview-panel {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  background: #ffffff;
  overflow: hidden;
}

.preview-panel__head,
.preview-panel__where {
  padding: 0.75rem 1rem;
}

.preview-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.preview-panel__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.preview-panel__page {
  padding: 1.25rem;
  background: var(--paper);
}

.preview-panel__abstract {
  margin: 0.75rem 0 0;
  padding-left: 0.875rem;
  border-left: 3px solid var(--rule-strong);
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--text-body);
}

.preview-panel__where {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.preview-panel__where ul {
  list-style: none;
  margin: 0.375rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-strong);
}

.preview-panel__where .v-icon {
  color: #2e7d32;
  margin-right: 0.25rem;
  vertical-align: -3px;
}
</style>
