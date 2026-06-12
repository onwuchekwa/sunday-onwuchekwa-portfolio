import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'about', name: 'about', component: () => import('@/views/AboutView.vue') },
        { path: 'publications', name: 'publications', component: () => import('@/views/PublicationsView.vue') },
        { path: 'news', name: 'news', component: () => import('@/views/NewsView.vue') },
        { path: 'news/:id', name: 'news-detail', component: () => import('@/views/NewsDetailView.vue') },
        { path: 'cv', name: 'cv', component: () => import('@/views/CvView.vue') },
        { path: 'contact', name: 'contact', component: () => import('@/views/ContactView.vue') },
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
        { path: 'media', name: 'admin-media', component: () => import('@/views/admin/MediaView.vue') },
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
})

export default router
