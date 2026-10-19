<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
import { useCv } from '@/composables/useCv'
import { usePublications } from '@/composables/usePublications'
import { useSiteSettings } from '@/composables/useSiteSettings'
import { useNotify } from '@/composables/useNotify'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { toResearchInterestDisplay } from '@/utils/cvFormat'
import { resolvePublicationStatus } from '@/types/content'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import UnsavedChangesBar from '@/components/admin/UnsavedChangesBar.vue'
import HomeContent from '@/components/HomeContent.vue'

const { about, load: loadAbout, save: saveAbout } = useAbout()
const { settings, load: loadSettings, save: saveSettings } = useSiteSettings()
const { cv, load: loadCv, visibleEntries } = useCv()
const { publications, load: loadPubs } = usePublications()
const notify = useNotify()
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
/** On narrower screens the form and preview share the space; this picks which shows. */
const narrowView = ref<'edit' | 'preview'>('edit')

const { isDirty, markSaved } = useUnsavedChanges(() => ({
  bio: about.value.bio,
  title: settings.value.title,
  headline: settings.value.headline,
  announcement: settings.value.announcement,
  beyondResearch: settings.value.beyondResearch,
}))

async function loadAll() {
  await Promise.all([loadAbout(), loadSettings(), loadCv(), loadPubs()])
  loading.value = false
  markSaved()
}

onMounted(loadAll)

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    // The bio lives in the about doc; the other home-page text lives in site settings.
    await Promise.all([saveAbout({ ...about.value }), saveSettings({ ...settings.value })])
    markSaved()
    notify.success('Home page saved. It’s live now.')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed'
    notify.error('Couldn’t save the home page.', e)
  } finally {
    saving.value = false
  }
}

const researchThemes = computed(() => {
  const section = cv.value.sections.find((s) => s.id === 'researchInterests')
  if (!section) return []
  return visibleEntries(section)
    .map(toResearchInterestDisplay)
    .filter((item) => item.title)
})

/** Same rule as the home page: featured first, then recent accepted or published work. */
const selectedPublications = computed(() => {
  const byRecency = [...publications.value].sort(
    (a, b) => b.year - a.year || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  )
  const featured = byRecency.filter((p) => p.featured)
  const others = byRecency.filter((p) => !p.featured && resolvePublicationStatus(p) !== 'under_review')
  return [...featured, ...others].slice(0, 2)
})

const bioParagraphCount = computed(
  () => (about.value.bio ?? '').split(/\n\s*\n/).filter((p) => p.trim()).length,
)
</script>

<template>
  <div>
    <AdminPageHeader title="Home Page">
      <template #description>
        Every part of your home page, top to bottom, with a live preview. Saved changes go live right away.
      </template>
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          :loading="saving"
          :disabled="!isDirty"
          @click="handleSave"
        >
          Save home page
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-else>
      <v-btn-toggle v-model="narrowView" mandatory density="compact" variant="outlined" divided class="home-editor__switch mb-4">
        <v-btn value="edit" prepend-icon="mdi-pencil">Edit</v-btn>
        <v-btn value="preview" prepend-icon="mdi-eye-outline">Preview</v-btn>
      </v-btn-toggle>

      <div class="home-editor" :class="`home-editor--show-${narrowView}`">
        <!-- ================= Blocks, in page order ================= -->
        <div class="home-editor__blocks">
          <section class="block">
            <header class="block__head">
              <span class="block__step">1</span>
              <h2 class="block__title">Role line</h2>
            </header>
            <v-text-field
              v-model="settings.title"
              hint="The small line above your headline; also the title in Google. Separate parts with |."
              persistent-hint
              placeholder="PhD Student in Computer Science | HCI Researcher | Brigham Young University"
            />
          </section>

          <section class="block">
            <header class="block__head">
              <span class="block__step">2</span>
              <h2 class="block__title">Headline</h2>
            </header>
            <v-textarea
              v-model="settings.headline"
              rows="2"
              auto-grow
              placeholder="Communities do not simply adopt new technologies. They negotiate them."
              hint="What you study, in one sentence, shown large. Leave empty to show “Hi, I’m …”."
              persistent-hint
            />
          </section>

          <section class="block">
            <header class="block__head">
              <span class="block__step">3</span>
              <h2 class="block__title">Announcement <span class="block__optional">optional</span></h2>
            </header>
            <v-textarea
              v-model="settings.announcement"
              rows="2"
              auto-grow
              placeholder="Seeking a research internship for Summer 2027 in …"
              hint="A highlighted box under the headline, with your email, CV, and Scholar links. Leave empty to hide it."
              persistent-hint
            />
          </section>

          <section class="block">
            <header class="block__head">
              <span class="block__step">4</span>
              <h2 class="block__title">Bio</h2>
              <span class="block__meta">{{ bioParagraphCount }} paragraph{{ bioParagraphCount === 1 ? '' : 's' }}</span>
            </header>
            <v-textarea
              v-model="about.bio"
              rows="8"
              auto-grow
              hint="First person. Leave a blank line between paragraphs; the first one is shown a little larger."
              persistent-hint
            />
          </section>

          <section class="block block--linked">
            <header class="block__head">
              <span class="block__step">5</span>
              <h2 class="block__title">Research cards</h2>
              <v-btn :to="{ name: 'admin-cv' }" variant="text" size="small" color="secondary" append-icon="mdi-chevron-right">
                Edit in CV Builder
              </v-btn>
            </header>
            <ol v-if="researchThemes.length" class="block__list">
              <li v-for="theme in researchThemes" :key="theme.title">
                <strong>{{ theme.title }}</strong>
                <span v-if="!theme.link" class="block__note">not linked</span>
              </li>
            </ol>
            <p v-else class="block__empty">No research interests yet; this section is hidden.</p>
          </section>

          <section class="block block--linked">
            <header class="block__head">
              <span class="block__step">6</span>
              <h2 class="block__title">Selected publications</h2>
              <v-btn :to="{ name: 'admin-publications' }" variant="text" size="small" color="secondary" append-icon="mdi-chevron-right">
                Manage papers
              </v-btn>
            </header>
            <p class="block__help">Papers marked Featured come first; your latest accepted work fills the rest.</p>
            <ol v-if="selectedPublications.length" class="block__list">
              <li v-for="pub in selectedPublications" :key="pub.id">
                <router-link :to="{ name: 'admin-publication-edit', params: { id: pub.id } }">{{ pub.title }}</router-link>
                <span v-if="pub.featured" class="block__note">featured</span>
              </li>
            </ol>
            <p v-else class="block__empty">No publications yet; this section is hidden.</p>
          </section>

          <section class="block">
            <header class="block__head">
              <span class="block__step">7</span>
              <h2 class="block__title">Beyond research <span class="block__optional">optional</span></h2>
            </header>
            <v-textarea
              v-model="settings.beyondResearch"
              rows="2"
              auto-grow
              hint="A short personal paragraph at the end of the page. Leave empty to hide it."
              persistent-hint
            />
          </section>

          <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
        </div>

        <!-- ================= Live preview ================= -->
        <aside class="home-editor__preview" aria-label="Preview of your home page">
          <div class="preview-frame">
            <div class="preview-frame__bar">
              <span class="preview-frame__dot" /><span class="preview-frame__dot" /><span class="preview-frame__dot" />
              <span class="preview-frame__url">sundayonwuchekwa.com</span>
            </div>
            <div class="preview-frame__viewport site-public">
              <div class="preview-frame__page">
                <HomeContent
                  :settings="settings"
                  :bio="about.bio"
                  :publications="publications"
                  :research-themes="researchThemes"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <UnsavedChangesBar :show="isDirty" :saving="saving" @save="handleSave" @discard="loadAll" />
  </div>
</template>

<style scoped>
.home-editor {
  display: grid;
  gap: 1.5rem;
}

.home-editor__blocks {
  display: grid;
  gap: 0.875rem;
  min-width: 0;
}

/* Side by side on wide screens; the Edit/Preview switch only matters below that. */
@media (min-width: 1280px) {
  .home-editor {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  .home-editor__switch {
    display: none !important;
  }

  .home-editor__preview {
    position: sticky;
    top: calc(var(--v-layout-top, 60px) + 1rem);
  }
}

@media (max-width: 1279.98px) {
  .home-editor--show-edit .home-editor__preview,
  .home-editor--show-preview .home-editor__blocks {
    display: none;
  }
}

.block {
  padding: 1.125rem 1.25rem 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: #ffffff;
}

.block--linked {
  background: rgba(var(--v-theme-primary), 0.025);
  border-style: dashed;
}

.block__head {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.block__step {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  background: var(--byu-navy);
  flex-shrink: 0;
}

.block__title {
  flex: 1 1 auto;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--byu-navy);
}

.block__optional,
.block__meta {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
}

.block__help,
.block__empty {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: var(--text-body);
}

.block__list {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.25rem;
  font-size: 0.9375rem;
}

.block__note {
  margin-left: 0.5rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(var(--v-theme-primary), 0.06);
}

/* A small browser window showing the real home page at reduced size. */
.preview-frame {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 46, 93, 0.08);
}

.preview-frame__bar {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: #eef1f4;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.preview-frame__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: #cfd6dd;
}

.preview-frame__url {
  margin-left: 0.5rem;
  padding: 0.125rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-body);
  background: #ffffff;
}

.preview-frame__viewport {
  max-height: calc(100vh - var(--v-layout-top, 60px) - 6rem);
  overflow: auto;
  background: var(--paper);
}

/* Links in the preview would leave the admin; it's for looking only. */
.preview-frame__page {
  zoom: 0.62;
  padding: 0 2.5rem;
  pointer-events: none;
}
</style>
