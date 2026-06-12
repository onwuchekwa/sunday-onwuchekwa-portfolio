<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNews } from '@/composables/useNews'
import type { NewsItem } from '@/types/content'

const { newsItems, load, create, update, remove, loading } = useNews()
const dialog = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const emptyForm = (): Omit<NewsItem, 'id'> => ({
  title: '',
  body: '',
  date: new Date().toISOString().split('T')[0],
  imageUrl: '',
  published: false,
  createdAt: new Date().toISOString(),
})

const form = ref(emptyForm())

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Date', key: 'date', width: 120 },
  { title: 'Published', key: 'published', width: 100 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

onMounted(() => load())

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  dialog.value = true
}

function openEdit(item: NewsItem) {
  editingId.value = item.id ?? null
  form.value = {
    title: item.title,
    body: item.body,
    date: item.date,
    imageUrl: item.imageUrl ?? '',
    published: item.published,
    createdAt: item.createdAt ?? new Date().toISOString(),
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
  if (confirm('Delete this news post?')) {
    await remove(id)
  }
}

async function togglePublished(id: string, current: boolean) {
  await update(id, { published: !current })
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">News</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add post</v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="newsItems"
      :loading="loading"
      class="elevation-1 rounded-lg"
    >
      <template #item.published="{ item }">
        <v-switch
          :model-value="item.published"
          hide-details
          density="compact"
          color="primary"
          @update:model-value="togglePublished(item.id!, item.published)"
        />
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="handleDelete(item.id!)" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="640" persistent>
      <v-card class="pa-6">
        <h2 class="text-h6 font-weight-bold mb-4">
          {{ editingId ? 'Edit' : 'Add' }} News Post
        </h2>
        <v-form @submit.prevent="handleSave">
          <v-text-field v-model="form.title" label="Title" required class="mb-2" />
          <v-text-field v-model="form.date" label="Date" type="date" required class="mb-2" />
          <v-textarea v-model="form.body" label="Body" rows="6" required class="mb-2" />
          <v-text-field v-model="form.imageUrl" label="Image URL (optional)" class="mb-2" />
          <v-switch v-model="form.published" label="Published" color="primary" class="mb-4" />
          <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
            <v-btn type="submit" color="primary" :loading="saving">Save</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>
