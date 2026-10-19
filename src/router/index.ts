import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { loadSiteSettingsOnce } from '@/composables/useSiteSettings'
import type { PublicPageId } from '@/types/content'
import { adminSiteOrigin, isAdminHost } from '@/utils/hosts'
import { setPageHead, type PageHead } from '@/utils/siteHead'

const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
      // The bio now lives on the home page and contact details in the sidebar/footer.
      { path: 'about', redirect: '/' },
      { path: 'contact', redirect: '/' },
      {
        path: 'publications',
        name: 'publications',
        component: () => import('@/views/PublicationsView.vue'),
        meta: {
          page: 'publications',
          head: {
            title: 'Publications',
            description: (name: string) => `Papers, posters, and workshop papers by ${name}, grouped by year and type.`,
          },
        },
      },
      {
        path: 'research/:slug',
        name: 'research-theme',
        component: () => import('@/views/ResearchThemeView.vue'),
        // A theme page is part of Publications: hidden when that page is.
        meta: { page: 'publications', head: { title: 'Research' } },
      },
      {
        path: 'news',
        name: 'news',
        component: () => import('@/views/NewsView.vue'),
        meta: {
          page: 'news',
          head: {
            title: 'News',
            description: (name: string) => `Paper acceptances, talks, awards, and research milestones from ${name}.`,
          },
        },
      },
      {
        path: 'news/:id',
        name: 'news-detail',
        component: () => import('@/views/NewsDetailView.vue'),
        meta: { page: 'news', head: { title: 'News' } },
      },
      {
        path: 'cv',
        name: 'cv',
        component: () => import('@/views/CvView.vue'),
        meta: {
          page: 'cv',
          fullWidth: true,
          head: {
            title: 'Curriculum Vitae',
            description: (name: string) => `Curriculum vitae of ${name}: education, publications, experience, and service.`,
          },
        },
      },
      {
        path: 'error',
        name: 'error',
        component: () => import('@/views/ErrorView.vue'),
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { head: { title: 'Page not found', noindex: true } },
      },
    ],
  },
]

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue') },
      { path: 'home', name: 'admin-home', component: () => import('@/views/admin/HomeEditView.vue') },
      { path: 'about', redirect: { name: 'admin-home' } },
      { path: 'publications', name: 'admin-publications', component: () => import('@/views/admin/PublicationsManageView.vue') },
      { path: 'publications/new', name: 'admin-publication-new', component: () => import('@/views/admin/PublicationEditView.vue') },
      { path: 'publications/:id', name: 'admin-publication-edit', component: () => import('@/views/admin/PublicationEditView.vue') },
      { path: 'news', name: 'admin-news', component: () => import('@/views/admin/NewsManageView.vue') },
      { path: 'cv', name: 'admin-cv', component: () => import('@/views/admin/CvManageView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'admin-dashboard' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes: isAdminHost ? adminRoutes : publicRoutes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!isAdminHost && /^\/admin(\/|$)/.test(to.path)) {
    const rest = to.fullPath.replace(/^\/admin/, '') || '/'
    window.location.replace(adminSiteOrigin + (rest.startsWith('/') ? rest : `/${rest}`))
    return false
  }

  if (isAdminHost) {
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    await auth.waitUntilReady()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }

    if (to.meta.guest && auth.isAuthenticated) {
      return { name: 'admin-dashboard' }
    }
    return
  }

  // Hidden public pages 404. Admins sign in on the admin host, so nobody is signed in here.
  const page = to.meta.page as PublicPageId | undefined
  if (page) {
    const settings = await loadSiteSettingsOnce()
    if (settings.pageVisibility[page] === false) {
      return { name: 'not-found' }
    }
  }
})

// Page titles and descriptions here mirror scripts/prerender-meta.mjs, which writes them into
// the static HTML for link previews. News posts replace theirs once the post has loaded.
router.afterEach((to) => {
  setPageHead((to.meta.head as PageHead | undefined) ?? {})
})

export default router
