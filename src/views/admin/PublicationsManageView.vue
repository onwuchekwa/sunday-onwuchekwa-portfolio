<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePublications } from '@/composables/usePublications'
import type { Publication, PublicationType } from '@/types/content'

const { publications, load, create, update, remove, loading } = usePublications()
const dialog = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const emptyForm = (): Omit<Publication, 'id'> => ({
  title: '',
  authors: '',
  venue: '',
  year: new Date().getFullYear(),
  type: 'paper',
  abstract: '',
  links: { pdf: '', doi: '', arxiv: '' },
  featured: false,
  includeInCv: true,
  cvOrder: 0,
  createdAt: new Date().toISOString(),
})

const form = ref(emptyForm())

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Year', key: 'year', width: 80 },
  { title: 'Type', key: 'type', width: 100 },
  { title: 'In CV', key: 'includeInCv', width: 80 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

onMounted(load)

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  dialog.value = true
}

function openEdit(pub: Publication) {
  editingId.value = pub.id ?? null
  form.value = {
    title: pub.title,
    authors: pub.authors,
    venue: pub.venue,
    year: pub.year,
    type: pub.type,
    abstract: pub.abstract ?? '',
    links: { ...pub.links },
    featured: pub.featured,
    includeInCv: pub.includeInCv,
    cvOrder: pub.cvOrder,
    createdAt: pub.createdAt ?? new Date().toISOString(),
  }
  dialog.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await update(editingId.value, form.value)
    } else {
      await create(form.value)
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

    <v-dialog v-model="dialog" max-width="720" persistent>
      <v-card class="pa-6">
        <h2 class="text-h6 font-weight-bold mb-4">
          {{ editingId ? 'Edit' : 'Add' }} Publication
        </h2>
        <v-form @submit.prevent="handleSave">
          <v-text-field v-model="form.title" label="Title" required class="mb-2" />
          <v-text-field v-model="form.authors" label="Authors" required class="mb-2" />
          <v-text-field v-model="form.venue" label="Venue" required class="mb-2" />
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="form.year" label="Year" type="number" required />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.type"
                :items="['paper', 'poster', 'workshop', 'other'] as PublicationType[]"
                label="Type"
              />
            </v-col>
          </v-row>
          <v-textarea v-model="form.abstract" label="Abstract" rows="3" class="mb-2" />
          <v-text-field v-model="form.links.pdf" label="PDF URL" class="mb-2" />
          <v-text-field v-model="form.links.doi" label="DOI URL" class="mb-2" />
          <v-text-field v-model="form.links.arxiv" label="arXiv URL" class="mb-2" />
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
