import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { initAnalytics } from './firebase/analytics'
import { isAdminHost } from './utils/hosts'
import { revealApp, whenLoadsSettle } from './utils/contentReady'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

if (isAdminHost) {
  const { useAuthStore } = await import('./stores/auth')
  useAuthStore().init()
}

// Mounting after the first route resolves keeps the prerendered snapshot on screen meanwhile.
await router.isReady().catch(() => {})
app.mount('#app')

const settled = await whenLoadsSettle(4000)
await nextTick()
revealApp(settled)

void initAnalytics()
