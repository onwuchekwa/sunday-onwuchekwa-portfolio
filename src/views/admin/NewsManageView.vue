<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { useConfirm } from '@/composables/useConfirm'
import { useNotify } from '@/composables/useNotify'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import ImageUploadField from '@/components/admin/ImageUploadField.vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import NewsBody from '@/components/NewsBody.vue'
import {
  estimateDocumentSize,
  FIRESTORE_DOC_LIMIT_BYTES,
  NEWS_IMAGE_MAX_BYTES,
} from '@/utils/imageToBase64'
import type { NewsItem } from '@/types/content'
import { todayLocalIsoDate } from '@/utils/date'

const { newsItems, load, create, update, remove, loading } = useNews()
const { confirm } = useConfirm()
const notify = useNotify()
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

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Date', key: 'date', width: 120 },
  { title: 'Published', key: 'published', width: 100 },
  { title: 'Actions', key: 'actions', sortable: false, width: 120 },
]

const bodyTab = ref<'write' | 'preview'>('write')
const bodyField = ref<{ $el: HTMLElement } | null>(null)

/**
 * Wrap the selected text (or insert a placeholder) with Markdown syntax, keeping the
 * selection on the placeholder so it can be typed over.
 */
function format(kind: 'h2' | 'h3' | 'link' | 'bold' | 'italic' | 'list') {
  const textarea = bodyField.value?.$el.querySelector('textarea')
  const body = form.value.body
  const start = textarea?.selectionStart ?? body.length
  const end = textarea?.selectionEnd ?? body.length
  const selected = body.slice(start, end)
  const lineStart = body.lastIndexOf('\n', start - 1) + 1

  let before = body.slice(0, start)
  let insert = ''
  let select: [number, number] = [0, 0]
  switch (kind) {
    case 'link': {
      const text = selected || 'link text'
      insert = `[${text}](https://)`
      select = [text.length + 3, text.length + 11]
      break
    }
    case 'bold':
    case 'italic': {
      const mark = kind === 'bold' ? '**' : '*'
      const text = selected || (kind === 'bold' ? 'bold text' : 'italic text')
      insert = `${mark}${text}${mark}`
      select = [mark.length, mark.length + text.length]
      break
    }
    default: {
      // Line-level formats go at the start of the current line, on a fresh line if needed.
      const prefix = kind === 'h2' ? '## ' : kind === 'h3' ? '### ' : '- '
      const text = selected || (kind === 'list' ? 'List item' : 'Subheading')
      before = body.slice(0, lineStart)
      const rest = body.slice(lineStart, start)
      insert = `${rest}${rest.trim() ? '\n' : ''}${prefix}${text}`
      select = [insert.length - text.length, insert.length]
    }
  }

  form.value.body = before + insert + body.slice(end)
  const caret = before.length
  requestAnimationFrame(() => {
    textarea?.focus()
    textarea?.setSelectionRange(caret + select[0], caret + select[1])
  })
}

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
  bodyTab.value = 'write'
  showDialog()
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
  bodyTab.value = 'write'
  showDialog()
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
    const wasPublished = form.value.published
    if (editingId.value) {
      await update(editingId.value, form.value)
    } else {
      await create(form.value)
    }
    dialog.value = false
    markFormClean()
    notify.success(wasPublished ? 'Post saved. It’s live now.' : 'Draft saved. Turn on Published when it’s ready.')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
    notify.error('Couldn’t save the post. Your edits are still here.', e)
  } finally {
    saving.value = false
  }
}

async function handleDelete(item: NewsItem) {
  const ok = await confirm({
    title: 'Delete this news post?',
    message: `“${item.title}” will be removed from your site. This can’t be undone.`,
  })
  if (!ok || !item.id) return
  try {
    await remove(item.id)
    notify.success('Post deleted.')
  } catch (e) {
    notify.error('Couldn’t delete the post.', e)
  }
}

async function togglePublished(id: string, current: boolean) {
  try {
    await update(id, { published: !current })
    notify.success(current ? 'Post unpublished. It’s hidden from your site.' : 'Post published. It’s live now.')
  } catch (e) {
    notify.error('Couldn’t change whether the post is published.', e)
  }
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
          <div class="news-editor mb-4">
            <div class="news-editor__bar">
              <v-btn-toggle v-model="bodyTab" mandatory density="compact" variant="text" color="primary">
                <v-btn value="write" size="small">Write</v-btn>
                <v-btn value="preview" size="small">Preview</v-btn>
              </v-btn-toggle>
              <div v-if="bodyTab === 'write'" class="news-editor__tools">
                <v-btn size="small" variant="text" title="Subheading" @click="format('h2')">H2</v-btn>
                <v-btn size="small" variant="text" title="Smaller subheading" @click="format('h3')">H3</v-btn>
                <v-btn size="small" variant="text" icon="mdi-format-bold" title="Bold" aria-label="Bold" @click="format('bold')" />
                <v-btn size="small" variant="text" icon="mdi-format-italic" title="Italic" aria-label="Italic" @click="format('italic')" />
                <v-btn size="small" variant="text" icon="mdi-link-variant" title="Link" aria-label="Link" @click="format('link')" />
                <v-btn size="small" variant="text" icon="mdi-format-list-bulleted" title="Bullet list" aria-label="Bullet list" @click="format('list')" />
              </div>
            </div>
            <v-textarea
              v-show="bodyTab === 'write'"
              ref="bodyField"
              v-model="form.body"
              label="Body"
              rows="8"
              auto-grow
              required
              hide-details="auto"
            />
            <div v-if="bodyTab === 'preview'" class="news-editor__preview">
              <NewsBody v-if="form.body.trim()" :body="form.body" />
              <p v-else class="text-body-2 text-body-readable mb-0">Nothing to preview yet.</p>
            </div>
            <p class="news-editor__help">
              <code>## Subheading</code> · <code>[link text](https://…)</code> · <code>**bold**</code> ·
              <code>*italic*</code> · <code>- bullet</code> · blank line = new paragraph. Plain web
              addresses become links automatically.
            </p>
          </div>
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
          <span v-if="formDirty" class="dialog-unsaved">Unsaved changes</span>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn type="submit" form="news-form" color="primary" variant="flat" :loading="saving">
            Save post
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.dialog-unsaved {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a35f00;
}

.news-editor__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.news-editor__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem;
}

.news-editor__tools .v-btn {
  font-weight: 700;
}

.news-editor__preview {
  min-height: 12rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 8px;
  background: #ffffff;
}

.news-editor__help {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-body);
}

.news-editor__help code {
  font-size: 0.8125rem;
  padding: 0 0.25rem;
  border-radius: 3px;
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
