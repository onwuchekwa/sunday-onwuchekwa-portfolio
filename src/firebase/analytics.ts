import { getFirebaseApp, isFirebaseConfigured } from './config'
import { isAdminHost } from '@/utils/hosts'

export async function initAnalytics(): Promise<void> {
  if (!import.meta.env.PROD || isAdminHost || !isFirebaseConfigured()) return
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return
  const { getAnalytics, isSupported } = await import('firebase/analytics')
  if (await isSupported()) getAnalytics(getFirebaseApp())
}
