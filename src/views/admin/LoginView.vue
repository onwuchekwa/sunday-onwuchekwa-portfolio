<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

async function handleLogin() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/admin'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center bg-background">
      <v-card width="420" class="pa-8">
        <div class="text-center mb-6">
          <v-icon icon="mdi-shield-lock" size="48" color="primary" class="mb-3" />
          <h1 class="text-h5 font-weight-bold">Admin Login</h1>
          <p class="text-body-2 text-medium-emphasis">Sunday Onwuchekwa Portfolio</p>
        </div>

        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            prepend-inner-icon="mdi-email"
            required
            class="mb-2"
          />
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock"
            required
            class="mb-4"
          />

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
            {{ error }}
          </v-alert>

          <v-btn type="submit" color="primary" block size="large" :loading="loading">
            Sign in
          </v-btn>
        </v-form>

        <v-btn to="/" variant="text" block class="mt-4" prepend-icon="mdi-arrow-left">
          Back to site
        </v-btn>
      </v-card>
    </v-main>
  </v-app>
</template>
