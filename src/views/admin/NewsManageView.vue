<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { useConfirm } from '@/composables/useConfirm'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import {
  estimateDocumentSize,
  FIRESTORE_DOC_LIMIT_BYTES,
  NEWS_IMAGE_MAX_BYTES,
} from '@/utils/imageToBase64'
import type { NewsItem } from '@/types/content'
import { todayLocalIsoDate } from '@/utils/date'

const { newsItems, load, create, update, remove, loading } = useNews()
const { confirm } = useConfirm()
const route = useRoute()
const router = useRouter()
const dialog = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

const emptyForm = (): Omit<NewsItem, 'id'> => ({
  title: '',
  body: '',
  date: todayLocalIsoDate(),
  imageUrl: '',
  published: false,
  createdAt: new Date().toISOString(),
})

const form = ref<Omit<NewsItem, 'id'> & { imageUrl: string }>(emptyForm())

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Date', key: 'date', width: 120 },
  { title: 'Published', key: 'published', width: 100 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

onMounted(async () => {
  await load()
  // Dashboard "Post news" shortcut
  if (route.query.new) {
    router.replace({ query: {} })
    openCreate()
  }
})

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  error.value = null
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
  error.value = null
  dialog.value = true
}

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    const docSize = estimateDocumentSize({ ...form.value })
    if (docSize > FIRESTORE_DOC_LIMIT_BYTES) {
      throw new Error(
        `Post too large (${Math.round(docSize / 1024)} KB). Shorten the body text or use a smaller image.`,
      )
    }
    if (editingId.value) {
      await update(editingId.value, form.value)
    } else {
      await create(form.value)
    }
    dialog.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    saving.value = false
  }
}

async function handleDelete(item: NewsItem) {
  const ok = await confirm({
    title: 'Delete this news post?',
    message: `“${item.title}” will be removed from your site. This can’t be undone.`,
  })
  if (ok && item.id) await remove(item.id)
}

async function togglePublished(id: string, current: boolean) {
  await update(id, { published: !current })
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="News"
      description="Published posts appear in the sidebar (latest 3) and on the News page."
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add post</v-btn>
      </template>
    </AdminPageHeader>

    <v-data-table
      :headers="headers"
      :items="newsItems"
      :loading="loading"
      class="admin-table"
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
        <v-btn icon="mdi-pencil" variant="text" size="small" aria-label="Edit post" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" aria-label="Delete post" @click="handleDelete(item)" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="760" persistent scrollable>
      <v-card class="admin-dialog">
        <v-card-title class="admin-dialog__title">
          {{ editingId ? 'Edit news post' : 'Add news post' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="admin-dialog__body">
        <v-form id="news-form" @submit.prevent="handleSave">
          <v-text-field v-model="form.title" label="Title" required class="mb-2" />
          <v-text-field v-model="form.date" label="Date" type="date" required class="mb-2" />
          <v-textarea v-model="form.body" label="Body" rows="6" auto-grow required class="mb-2" />
          <ImageUploadField
            v-model="form.imageUrl"
            label="Featured image (optional)"
            :max-dimension="800"
            :max-bytes="NEWS_IMAGE_MAX_BYTES"
            hint="Compressed and embedded in this post. Keep body text concise if using a large image."
            class="mb-2"
          />
          <v-switch v-model="form.published" label="Published" color="primary" class="mb-4" />

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2">
            {{ error }}
          </v-alert>
        </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="admin-dialog__actions">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn type="submit" form="news-form" color="primary" variant="flat" :loading="saving">
            Save post
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
