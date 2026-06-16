<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCv } from '@/composables/useCv'
import { CV_SECTION_META, entryToFormValues, isAboutEntryVisible, isEntryVisible, type CvSectionId } from '@/types/cv'

const { cv, load, save, loading } = useCv()
const activeTab = ref<CvSectionId>('researchInterests')
const saving = ref(false)
const snackbar = ref(false)
const entryDialog = ref(false)
const editingEntryIndex = ref<number | null>(null)
const entryForm = ref<Record<string, string>>({})
const entryVisible = ref(true)
const entryShowOnAbout = ref(true)

const isEducationTab = computed(() => activeTab.value === 'education')

const tableHeaders = computed(() => {
  const headers = [
    { title: 'Entry', key: 'display' },
    { title: 'Show on public CV', key: 'visible', width: 150 },
  ]
  if (isEducationTab.value) {
    headers.push({ title: 'Show on About', key: 'showOnAbout', width: 150 })
  }
  headers.push({ title: 'Actions', key: 'actions', width: 100 })
  return headers
})

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
        text: 'Powers Research Focus cards on the home page, interest chips on About, and the Research Interests line on your public CV. Use Material Design Icons (e.g. mdi-church, mdi-account-group).',
      }
    case 'education':
      return {
        type: 'info' as const,
        text: 'End date: completed `Jun 2022`; in progress `Jun 2028` or `2024 – Present` (shown as Anticipated: Mon YYYY). About shows up to 4 most recent degrees with "Show on About" enabled.',
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
        text: 'Academic service: peer review, program committees, workshop or conference organizing, and departmental or university committees. Not volunteer work — use Volunteer Experience for that.',
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

onMounted(load)

function openAddEntry() {
  editingEntryIndex.value = null
  entryForm.value = {}
  entryVisible.value = true
  entryShowOnAbout.value = true
  activeMeta.value?.fields.forEach((f) => {
    entryForm.value[f.key] = ''
  })
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
  entryShowOnAbout.value = isAboutEntryVisible(entry)
  entryDialog.value = true
}

function saveEntry() {
  const section = activeSection.value
  if (!section) return

  const entry: Record<string, unknown> = {
    ...entryForm.value,
    visible: entryVisible.value,
  }
  if (isEducationTab.value) {
    entry.showOnAbout = entryShowOnAbout.value
  }
  if (editingEntryIndex.value !== null) {
    section.entries[editingEntryIndex.value] = entry
  } else {
    section.entries.push(entry)
  }
  entryDialog.value = false
}

function deleteEntry(index: number) {
  activeSection.value?.entries.splice(index, 1)
}

function toggleEntryVisibility(index: number, visible: boolean) {
  const section = activeSection.value
  if (!section) return
  section.entries[index] = { ...section.entries[index], visible }
}

function toggleShowOnAbout(index: number, showOnAbout: boolean) {
  const section = activeSection.value
  if (!section) return
  section.entries[index] = { ...section.entries[index], showOnAbout }
}

async function handleSave() {
  saving.value = true
  try {
    await save({ ...cv.value })
    snackbar.value = true
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
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">CV Builder</h1>
        <p class="text-body-2 text-medium-emphasis">
          Publications are managed in
          <router-link to="/admin/publications">Publications</router-link>
          with the "Include in CV" toggle.
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn to="/cv" target="_blank" variant="tonal" prepend-icon="mdi-eye">
          Preview CV
        </v-btn>
        <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="handleSave">
          Save CV
        </v-btn>
      </div>
    </div>

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

        <v-card class="pa-4 mt-4">
          <h3 class="text-subtitle-2 font-weight-bold mb-3">Publications intro</h3>
          <v-textarea
            v-model="cv.publicationsIntro"
            label="Intro paragraph on public CV"
            rows="5"
            hint="Shown above publication subsections on /cv and in the PDF."
            persistent-hint
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

          <v-data-table
            v-if="activeSection?.entries.length"
            :headers="tableHeaders"
            :items="
              activeSection.entries.map((e, i) => ({
                ...e,
                display: entryDisplay(e),
                visible: isEntryVisible(e),
                showOnAbout: isAboutEntryVisible(e),
                _index: i,
              }))
            "
            :row-props="({ item }) => ({ class: item.visible ? '' : 'cv-entry-hidden' })"
            class="elevation-0"
          >
            <template #item.visible="{ item }">
              <v-switch
                :model-value="item.visible"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="toggleEntryVisibility(item._index, $event ?? true)"
              />
            </template>
            <template #item.showOnAbout="{ item }">
              <v-switch
                :model-value="item.showOnAbout"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="toggleShowOnAbout(item._index, $event ?? true)"
              />
            </template>
            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditEntry(item._index)" />
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteEntry(item._index)" />
            </template>
          </v-data-table>

          <v-alert v-else type="info" variant="tonal">
            No entries yet. Click "Add entry" to start building this section.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="entryDialog" max-width="560" persistent>
      <v-card class="pa-6">
        <h3 class="text-h6 font-weight-bold mb-4">
          {{ editingEntryIndex !== null ? 'Edit' : 'Add' }} Entry
        </h3>
        <v-form @submit.prevent="saveEntry">
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
            class="mb-2"
          />
          <v-switch
            v-if="isEducationTab"
            v-model="entryShowOnAbout"
            label="Show on About page"
            color="primary"
            class="mb-2"
          />
          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" @click="entryDialog = false">Cancel</v-btn>
            <v-btn type="submit" color="primary">Save entry</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      CV saved successfully.
    </v-snackbar>
  </div>
</template>

<style scoped>
:deep(.cv-entry-hidden) {
  opacity: 0.55;
}
</style>
