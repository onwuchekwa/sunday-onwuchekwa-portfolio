import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '@/firebase/config'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const initialized = ref(false)
  let readyResolve: (() => void) | null = null
  const ready = new Promise<void>((resolve) => {
    readyResolve = resolve
  })

  const isAuthenticated = computed(() => Boolean(user.value))

  function init() {
    if (initialized.value) return
    initialized.value = true

    if (!isFirebaseConfigured()) {
      loading.value = false
      readyResolve?.()
      return
    }

    onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      user.value = firebaseUser
      loading.value = false
      readyResolve?.()
    })
  }

  async function waitUntilReady() {
    init()
    await ready
  }

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    user.value = credential.user
    return credential.user
  }

  async function logout() {
    await signOut(getFirebaseAuth())
    user.value = null
  }

  return { user, loading, isAuthenticated, init, waitUntilReady, login, logout }
})
