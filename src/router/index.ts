import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loadSiteSettingsOnce } from '@/composables/useSiteSettings'
import type { PublicPageId } from '@/types/content'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
          meta: { page: 'about' },
        },
        {
          path: 'publications',
          name: 'publications',
          component: () => import('@/views/PublicationsView.vue'),
          meta: { page: 'publications' },
        },
        {
          path: 'news',
          name: 'news',
          component: () => import('@/views/NewsView.vue'),
          meta: { page: 'news' },
        },
        {
          path: 'news/:id',
          name: 'news-detail',
          component: () => import('@/views/NewsDetailView.vue'),
          meta: { page: 'news' },
        },
        {
          path: 'cv',
          name: 'cv',
          component: () => import('@/views/CvView.vue'),
          meta: { page: 'cv' },
        },
        {
          path: 'contact',
          name: 'contact',
          component: () => import('@/views/ContactView.vue'),
          meta: { page: 'contact' },
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
        },
      ],
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue') },
        { path: 'about', name: 'admin-about', component: () => import('@/views/admin/AboutEditView.vue') },
        { path: 'publications', name: 'admin-publications', component: () => import('@/views/admin/PublicationsManageView.vue') },
        { path: 'news', name: 'admin-news', component: () => import('@/views/admin/NewsManageView.vue') },
        { path: 'cv', name: 'admin-cv', component: () => import('@/views/admin/CvManageView.vue') },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.waitUntilReady()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }

  // Hidden public pages 404 for visitors; admins can still preview them.
  const page = to.meta.page as PublicPageId | undefined
  if (page && !auth.isAuthenticated) {
    const settings = await loadSiteSettingsOnce()
    if (settings.pageVisibility[page] === false) {
      return { name: 'not-found' }
    }
  }
})

export default router
