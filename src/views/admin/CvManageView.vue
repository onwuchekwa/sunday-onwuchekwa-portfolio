<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCv } from '@/composables/useCv'
import { publicSiteOrigin } from '@/utils/hosts'
import { useConfirm } from '@/composables/useConfirm'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import UnsavedChangesBar from '@/components/admin/UnsavedChangesBar.vue'
import { useNotify } from '@/composables/useNotify'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { CV_SECTION_META, entryToFormValues, isEntryVisible, type CvSectionId } from '@/types/cv'

const { cv, load, save, loading } = useCv()
const activeTab = ref<CvSectionId>('researchInterests')
const saving = ref(false)
const { confirm } = useConfirm()
const notify = useNotify()
const entryDialog = ref(false)
const editingEntryIndex = ref<number | null>(null)
const entryForm = ref<Record<string, string>>({})
const entryVisible = ref(true)
const entryFormBaseline = ref('')

/** Edits here stay in the browser until Save CV; leaving the page asks first. */
const { isDirty, markSaved } = useUnsavedChanges(() => cv.value.sections)

async function loadCv() {
  await load()
  markSaved()
}

/** These sections are ordered by their dates on the CV, so manual order doesn't apply. */
const DATE_SORTED_SECTIONS: CvSectionId[] = [
  'education',
  'appointments',
  'industryExperience',
  'volunteerExperience',
]
const canReorder = computed(() => !DATE_SORTED_SECTIONS.includes(activeTab.value))

// ---- Reordering: drag a row, or use the arrow buttons (keyboard and touch) ----
const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)

function moveEntry(from: number, to: number) {
  const entries = activeSection.value?.entries
  if (!entries || from === to || to < 0 || to >= entries.length) return
  const [moved] = entries.splice(from, 1)
  entries.splice(to, 0, moved)
}

function onDragStart(index: number, event: DragEvent) {
  dragFrom.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(index: number) {
  if (dragFrom.value !== null) moveEntry(dragFrom.value, index)
  dragFrom.value = null
  dragOver.value = null
}

function onDragEnd() {
  dragFrom.value = null
  dragOver.value = null
}

const activeSection = computed(() =>
  cv.value.sections.find((s) => s.id === activeTab.value),
)

const activeMeta = computed(() =>
  CV_SECTION_META.find((m) => m.id === activeTab.value),
)

const sectionGuidance = computed(() => {
  switch (activeTab.value) {
    case 'researchInterests':
      return {
        type: 'info' as const,
        text: 'Each entry is a card in the Research section of your home page and an item in the Research Interests line on your CV. Drag to set their order. Add a link to make a card clickable.',
      }
    case 'education':
      return {
        type: 'info' as const,
        text: 'End date: completed `Jun 2022`; in progress `Jun 2028` or `2024 – Present` (shown as Expected Mon YYYY).',
      }
    case 'appointments':
      return {
        type: 'info' as const,
        text: 'Dates: current `Jun 2025 – Present`; past `May 2023 – Aug 2023`. Current roles appear first, sorted by start date. Location is optional on line 2.',
      }
    case 'industryExperience':
      return {
        type: 'info' as const,
        text: 'Dates: current `Jun 2025 – Present`; past `May 2023 – Aug 2023`. Current roles appear first, sorted by start date. Company and location appear on line 2.',
      }
    case 'volunteerExperience':
      return {
        type: 'info' as const,
        text: 'Dates: current `Jun 2025 – Present`; past `May 2023 – Aug 2023`. Current roles appear first, sorted by start date. Organization and location appear on line 2.',
      }
    case 'service':
      return {
        type: 'info' as const,
        text: 'Academic service: peer review, program committees, workshop or conference organizing, and departmental or university committees. Not volunteer work — use Volunteer Experience for that. Organization appears on the left of line 2 and Venue / location on the right.',
      }
    case 'certificates':
      return {
        type: 'info' as const,
        text: 'Each entry is one certificate name. The public CV lists all visible names separated by |.',
      }
    default:
      return null
  }
})

onMounted(loadCv)

function openAddEntry() {
  editingEntryIndex.value = null
  entryForm.value = {}
  entryVisible.value = true
  activeMeta.value?.fields.forEach((f) => {
    entryForm.value[f.key] = ''
  })
  entryFormBaseline.value = JSON.stringify(entryForm.value)
  entryDialog.value = true
}

function openEditEntry(index: number) {
  const section = activeSection.value
  const meta = activeMeta.value
  if (!section || !meta) return
  editingEntryIndex.value = index
  const entry = section.entries[index]
  entryForm.value = entryToFormValues(activeTab.value, entry, meta)
  entryVisible.value = isEntryVisible(entry)
  entryFormBaseline.value = JSON.stringify(entryForm.value)
  entryDialog.value = true
}

function saveEntry() {
  const section = activeSection.value
  if (!section) return

  const entry: Record<string, unknown> = {
    ...entryForm.value,
    visible: entryVisible.value,
  }
  if (editingEntryIndex.value !== null) {
    section.entries[editingEntryIndex.value] = entry
  } else {
    section.entries.push(entry)
  }
  entryDialog.value = false
}

async function deleteEntry(index: number) {
  const ok = await confirm({
    title: 'Delete this entry?',
    message: 'It is removed from the builder now and from your CV when you click Save CV.',
  })
  if (ok) activeSection.value?.entries.splice(index, 1)
}

async function closeEntryDialog() {
  const ok =
    JSON.stringify(entryForm.value) === entryFormBaseline.value ||
    (await confirm({
      title: 'Discard this entry’s changes?',
      message: 'What you typed in this entry hasn’t been added to the CV yet.',
      confirmText: 'Discard changes',
    }))
  if (ok) entryDialog.value = false
}

function toggleEntryVisibility(index: number, visible: boolean) {
  const section = activeSection.value
  if (!section) return
  section.entries[index] = { ...section.entries[index], visible }
}

async function handleSave() {
  saving.value = true
  try {
    await save({ ...cv.value })
    markSaved()
    notify.success('CV saved. It’s live now.')
  } catch (e) {
    notify.error('Couldn’t save your CV. Your edits are still here.', e)
  } finally {
    saving.value = false
  }
}

function entryDisplay(entry: Record<string, unknown>): string {
  return Object.entries(entry)
    .filter(([key]) => key !== 'visible' && key !== 'showOnAbout')
    .map(([, value]) => value)
    .filter(Boolean)
    .join(' · ')
}
</script>

<template>
  <div>
    <AdminPageHeader title="CV Builder">
      <template #description>
        Sections follow US academic order. Publications are managed in
        <router-link :to="{ name: 'admin-publications' }">Publications</router-link>
        with the “Include in CV” toggle.
      </template>
      <template #actions>
        <v-btn :href="`${publicSiteOrigin}/cv`" target="_blank" rel="noopener" variant="tonal" prepend-icon="mdi-eye">
          Preview CV
        </v-btn>
        <v-btn color="primary" :loading="saving" :disabled="!isDirty" prepend-icon="mdi-content-save" @click="handleSave">
          Save CV
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-2">
          <v-list density="compact" nav>
            <v-list-item
              v-for="meta in CV_SECTION_META"
              :key="meta.id"
              :title="meta.title"
              :active="activeTab === meta.id"
              rounded="lg"
              @click="activeTab = meta.id"
            />
          </v-list>
        </v-card>

        <v-card class="pa-4 mt-4">
          <h3 class="text-subtitle-2 font-weight-bold mb-3">Section visibility</h3>
          <v-switch
            v-for="section in cv.sections"
            :key="section.id"
            v-model="section.visible"
            :label="section.title"
            density="compact"
            color="primary"
            hide-details
            class="mb-1"
          />
        </v-card>

      </v-col>

      <v-col cols="12" md="9">
        <v-card class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <h2 class="text-h6 font-weight-bold">{{ activeMeta?.title }}</h2>
              <p
                v-if="activeTab === 'appointments'"
                class="text-caption text-medium-emphasis mb-0"
              >
                Academic & university roles
              </p>
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" size="small" @click="openAddEntry">
              Add entry
            </v-btn>
          </div>

          <v-alert
            v-if="sectionGuidance"
            :type="sectionGuidance.type"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ sectionGuidance.text }}
          </v-alert>

          <p v-if="activeSection?.entries.length && !canReorder" class="cv-order-note">
            <v-icon icon="mdi-calendar-blank-outline" size="16" />
            Your CV lists these by date automatically, newest first.
          </p>
          <ol v-if="activeSection?.entries.length" class="cv-entries" aria-label="Entries">
            <li
              v-for="(entry, index) in activeSection.entries"
              :key="index"
              class="cv-entry"
              :class="{
                'cv-entry--hidden': !isEntryVisible(entry),
                'cv-entry--dragging': dragFrom === index,
                'cv-entry--over': dragOver === index && dragFrom !== index,
              }"
              :draggable="canReorder"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent="dragOver = index"
              @dragleave="dragOver = dragOver === index ? null : dragOver"
              @drop.prevent="onDrop(index)"
              @dragend="onDragEnd"
            >
              <v-icon
                v-if="canReorder"
                icon="mdi-drag-vertical"
                class="cv-entry__handle"
                aria-hidden="true"
              />
              <button type="button" class="cv-entry__text" @click="openEditEntry(index)">
                {{ entryDisplay(entry) || 'Untitled entry' }}
              </button>
              <div class="cv-entry__actions">
                <template v-if="canReorder">
                  <v-btn
                    icon="mdi-arrow-up"
                    variant="text"
                    size="small"
                    :disabled="index === 0"
                    aria-label="Move up"
                    @click="moveEntry(index, index - 1)"
                  />
                  <v-btn
                    icon="mdi-arrow-down"
                    variant="text"
                    size="small"
                    :disabled="index === activeSection.entries.length - 1"
                    aria-label="Move down"
                    @click="moveEntry(index, index + 1)"
                  />
                </template>
                <v-switch
                  :model-value="isEntryVisible(entry)"
                  color="primary"
                  density="compact"
                  hide-details
                  :aria-label="isEntryVisible(entry) ? 'Shown on public CV' : 'Hidden from public CV'"
                  :title="isEntryVisible(entry) ? 'Shown on public CV' : 'Hidden from public CV'"
                  class="cv-entry__switch"
                  @update:model-value="toggleEntryVisibility(index, $event ?? true)"
                />
                <v-btn icon="mdi-pencil" variant="text" size="small" aria-label="Edit entry" @click="openEditEntry(index)" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" aria-label="Delete entry" @click="deleteEntry(index)" />
              </div>
            </li>
          </ol>

          <v-alert v-else type="info" variant="tonal">
            No entries yet. Click "Add entry" to start building this section.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>

    <UnsavedChangesBar
      :show="isDirty"
      :saving="saving"
      save-label="Save CV"
      @save="handleSave"
      @discard="loadCv"
    />

    <v-dialog v-model="entryDialog" max-width="640" persistent scrollable>
      <v-card class="admin-dialog">
        <v-card-title class="admin-dialog__title">
          {{ editingEntryIndex !== null ? 'Edit' : 'Add' }} {{ activeMeta?.title ?? 'entry' }} entry
        </v-card-title>
        <v-divider />
        <v-card-text class="admin-dialog__body">
        <v-form id="cv-entry-form" @submit.prevent="saveEntry">
          <template v-for="field in activeMeta?.fields" :key="field.key">
            <v-textarea
              v-if="field.type === 'textarea'"
              v-model="entryForm[field.key]"
              :label="field.label"
              rows="3"
              class="mb-2"
            />
            <v-text-field
              v-else
              v-model="entryForm[field.key]"
              :label="field.label"
              class="mb-2"
            />
          </template>
          <v-switch
            v-model="entryVisible"
            label="Show on public CV"
            color="primary"
            hide-details
          />
        </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="admin-dialog__actions">
          <v-spacer />
          <v-btn variant="text" @click="closeEntryDialog">Cancel</v-btn>
          <v-btn type="submit" form="cv-entry-form" color="primary" variant="flat">Save entry</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.cv-order-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--text-body);
}

.cv-entries {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.cv-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem 0.375rem 0.75rem;
  background: #ffffff;
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}

.cv-entry + .cv-entry {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.cv-entry[draggable='true'] {
  cursor: grab;
}

.cv-entry--hidden .cv-entry__text {
  opacity: 0.5;
}

.cv-entry--dragging {
  opacity: 0.4;
}

/* Where the dragged row will land. */
.cv-entry--over {
  box-shadow: inset 0 2px 0 rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.04);
}

.cv-entry__handle {
  color: rgba(var(--v-theme-on-surface), 0.4);
  flex-shrink: 0;
}

.cv-entry__text {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.5rem 0;
  text-align: left;
  font: inherit;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cv-entry__text:hover {
  color: rgb(var(--v-theme-secondary));
}

.cv-entry__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.cv-entry__switch {
  flex: 0 0 auto;
  margin: 0 0.25rem;
}
</style>
