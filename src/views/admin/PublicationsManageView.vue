<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublications } from '@/composables/usePublications'
import { useConfirm } from '@/composables/useConfirm'
import { useNotify } from '@/composables/useNotify'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AuthorList from '@/components/AuthorList.vue'
import {
  PUBLICATION_STATUSES,
  publicationTypeLabel,
  resolvePublicationStatus,
  resolveVenueShort,
  type Publication,
} from '@/types/content'

const { publications, load, update, remove, loading, cvPublications } = usePublications()
const { confirm } = useConfirm()
const notify = useNotify()
const route = useRoute()
const router = useRouter()

const search = ref('')
const mode = ref<'list' | 'cvOrder'>('list')

onMounted(async () => {
  // Old dashboard links used ?new=1.
  if (route.query.new) {
    router.replace({ name: 'admin-publication-new' })
    return
  }
  await load()
})

/** Newest first; under review on top, since that's what changes most. */
const sorted = computed(() =>
  [...publications.value].sort((a, b) => {
    const review = Number(resolvePublicationStatus(b) === 'under_review') - Number(resolvePublicationStatus(a) === 'under_review')
    return review || b.year - a.year || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  }),
)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return sorted.value
  return sorted.value.filter((pub) =>
    [pub.title, pub.venue, pub.venueShort, String(pub.year), ...pub.authors.map((a) => a.name)]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

function statusLabel(pub: Publication): string {
  const value = resolvePublicationStatus(pub)
  return PUBLICATION_STATUSES.find((s) => s.value === value)?.title ?? value
}

function openEdit(pub: Publication) {
  router.push({ name: 'admin-publication-edit', params: { id: pub.id } })
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

async function toggle(pub: Publication, field: 'includeInCv' | 'featured') {
  const next = !pub[field]
  try {
    await update(pub.id!, { [field]: next })
    notify.success(
      field === 'includeInCv'
        ? next ? 'Added to your CV.' : 'Removed from your CV.'
        : next ? 'Featured on your home page.' : 'No longer featured.',
    )
  } catch (e) {
    notify.error('Couldn’t update the publication.', e)
  }
}

// ---- CV order: drag (or arrows) instead of typing numbers ----
const cvOrderList = ref<Publication[]>([])
const savingOrder = ref(false)
const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)

function startCvOrder() {
  cvOrderList.value = [...cvPublications()]
  mode.value = 'cvOrder'
}

function moveCv(from: number, to: number) {
  const list = cvOrderList.value
  if (from === to || to < 0 || to >= list.length) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
}

function onDrop(index: number) {
  if (dragFrom.value !== null) moveCv(dragFrom.value, index)
  dragFrom.value = null
  dragOver.value = null
}

async function saveCvOrder() {
  savingOrder.value = true
  try {
    const changed = cvOrderList.value
      .map((pub, index) => ({ pub, order: (index + 1) * 10 }))
      .filter(({ pub, order }) => pub.cvOrder !== order)
    await Promise.all(changed.map(({ pub, order }) => update(pub.id!, { cvOrder: order })))
    notify.success('CV order saved.')
    mode.value = 'list'
  } catch (e) {
    notify.error('Couldn’t save the CV order.', e)
  } finally {
    savingOrder.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Publications"
      description="Everything on your Publications page. Click a paper to edit it; the switches update the site right away."
    >
      <template #actions>
        <v-btn
          v-if="mode === 'list'"
          variant="tonal"
          prepend-icon="mdi-format-list-bulleted"
          :disabled="!cvPublications().length"
          @click="startCvOrder"
        >
          Order in CV
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'admin-publication-new' }">
          Add publication
        </v-btn>
      </template>
    </AdminPageHeader>

    <!-- ============ CV order mode ============ -->
    <v-card v-if="mode === 'cvOrder'" class="pa-5">
      <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold mb-1">Order in your CV</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Drag papers (or use the arrows) into the order you want within each CV group.
          </p>
        </div>
        <div class="d-flex ga-2">
          <v-btn variant="text" :disabled="savingOrder" @click="mode = 'list'">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingOrder" @click="saveCvOrder">Save order</v-btn>
        </div>
      </div>
      <ol class="order-list">
        <li
          v-for="(pub, index) in cvOrderList"
          :key="pub.id"
          class="order-row"
          :class="{ 'order-row--dragging': dragFrom === index, 'order-row--over': dragOver === index && dragFrom !== index }"
          draggable="true"
          @dragstart="dragFrom = index"
          @dragover.prevent="dragOver = index"
          @drop.prevent="onDrop(index)"
          @dragend="dragFrom = null; dragOver = null"
        >
          <v-icon icon="mdi-drag-vertical" class="order-row__handle" aria-hidden="true" />
          <span class="order-row__index">{{ index + 1 }}</span>
          <span class="order-row__title">{{ pub.title }}</span>
          <span class="order-row__meta">{{ pub.year }} · {{ publicationTypeLabel(pub.type) }}</span>
          <v-btn icon="mdi-arrow-up" variant="text" size="small" :disabled="index === 0" aria-label="Move up" @click="moveCv(index, index - 1)" />
          <v-btn icon="mdi-arrow-down" variant="text" size="small" :disabled="index === cvOrderList.length - 1" aria-label="Move down" @click="moveCv(index, index + 1)" />
        </li>
      </ol>
    </v-card>

    <!-- ============ List mode ============ -->
    <template v-else>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search by title, author, venue, or year"
        density="comfortable"
        hide-details
        clearable
        class="mb-4 pub-search"
      />

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <div v-else-if="!publications.length" class="empty-state">
        <v-icon icon="mdi-book-open-variant" size="40" />
        <p class="empty-state__title">No publications yet</p>
        <p>Add your first paper. If it has a DOI, its details fill in automatically.</p>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'admin-publication-new' }">Add publication</v-btn>
      </div>

      <p v-else-if="!filtered.length" class="text-body-2 text-medium-emphasis">
        Nothing matches “{{ search }}”.
      </p>

      <ul v-else class="pub-rows">
        <li v-for="pub in filtered" :key="pub.id" class="pub-row">
          <button type="button" class="pub-row__main" @click="openEdit(pub)">
            <span class="pub-row__thumb" :class="{ 'pub-row__thumb--empty': !pub.thumbnailUrl }">
              <img v-if="pub.thumbnailUrl" :src="pub.thumbnailUrl" alt="" loading="lazy" />
              <v-icon v-else icon="mdi-image-outline" size="22" />
            </span>
            <span class="pub-row__body">
              <span class="pub-row__chips">
                <span
                  class="chip"
                  :class="resolvePublicationStatus(pub) === 'under_review' ? 'chip--review' : 'chip--venue'"
                >
                  {{ resolvePublicationStatus(pub) === 'under_review' ? 'Under review' : resolveVenueShort(pub) || pub.year }}
                </span>
                <span class="chip chip--plain">{{ publicationTypeLabel(pub.type) }}</span>
                <span v-if="resolvePublicationStatus(pub) === 'accepted'" class="chip chip--plain">{{ statusLabel(pub) }}</span>
                <span v-if="pub.featured" class="chip chip--featured">
                  <v-icon icon="mdi-star" size="12" /> Featured
                </span>
              </span>
              <span class="pub-row__title">{{ pub.title }}</span>
              <span class="pub-row__authors"><AuthorList :authors="pub.authors" /></span>
              <span v-if="!pub.thumbnailUrl" class="pub-row__hint">No thumbnail yet</span>
            </span>
          </button>
          <div class="pub-row__controls">
            <v-switch
              :model-value="pub.featured"
              label="Featured"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="toggle(pub, 'featured')"
            />
            <v-switch
              :model-value="pub.includeInCv"
              label="In CV"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="toggle(pub, 'includeInCv')"
            />
            <div class="d-flex">
              <v-btn icon="mdi-pencil" variant="text" size="small" aria-label="Edit publication" @click="openEdit(pub)" />
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" aria-label="Delete publication" @click="handleDelete(pub)" />
            </div>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.pub-search {
  max-width: 32rem;
}

.pub-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.pub-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pub-row:hover {
  border-color: rgba(var(--v-theme-secondary), 0.35);
  box-shadow: 0 4px 14px rgba(0, 46, 93, 0.06);
}

.pub-row__main {
  flex: 1 1 26rem;
  min-width: 0;
  display: flex;
  gap: 1rem;
  padding: 0;
  text-align: left;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}

.pub-row__thumb {
  flex: 0 0 96px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--rule);
}

.pub-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pub-row__thumb--empty {
  color: rgba(var(--v-theme-on-surface), 0.3);
  border-style: dashed;
}

.pub-row__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pub-row__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.0625rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
}

.chip--venue {
  background: rgba(var(--v-theme-primary), 0.08);
  color: var(--byu-navy);
}

.chip--review {
  background: #fff4e0;
  color: #8a5300;
}

.chip--plain {
  color: var(--text-body);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.chip--featured {
  background: #fdf3d0;
  color: #7a5b00;
}

.pub-row__title {
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-strong);
}

.pub-row__main:hover .pub-row__title {
  color: rgb(var(--v-theme-secondary));
}

.pub-row__authors {
  font-size: 0.875rem;
  color: var(--text-body);
}

.pub-row__hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pub-row__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 1rem;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 3rem 1rem;
  text-align: center;
  border: 1px dashed rgba(var(--v-theme-primary), 0.2);
  border-radius: 12px;
  color: var(--text-body);
}

.empty-state__title {
  margin: 0.5rem 0 0;
  font-weight: 700;
  color: var(--byu-navy);
}

.order-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.order-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  cursor: grab;
}

.order-row + .order-row {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.order-row--dragging {
  opacity: 0.4;
}

.order-row--over {
  box-shadow: inset 0 2px 0 rgb(var(--v-theme-secondary));
}

.order-row__handle {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.order-row__index {
  width: 1.5rem;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.order-row__title {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-row__meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
