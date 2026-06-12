<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAbout } from '@/composables/useAbout'
const { about, load, save, loading } = useAbout()
const saving = ref(false)
const snackbar = ref(false)
const newInterest = ref('')

onMounted(load)

function addInterest() {
  if (newInterest.value.trim()) {
    about.value.researchInterests.push(newInterest.value.trim())
    newInterest.value = ''
  }
}

function removeInterest(index: number) {
  about.value.researchInterests.splice(index, 1)
}

function addEducation() {
  about.value.education.push({ degree: '', institution: '', year: '', details: '' })
}

function removeEducation(index: number) {
  about.value.education.splice(index, 1)
}

async function handleSave() {
  saving.value = true
  try {
    await save({ ...about.value })
    snackbar.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-6">Edit About</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <v-card class="pa-6">
      <v-form @submit.prevent="handleSave">
        <v-textarea
          v-model="about.bio"
          label="Bio"
          rows="8"
          hint="Your academic biography"
          persistent-hint
          class="mb-6"
        />

        <h2 class="text-h6 font-weight-bold mb-3">Research Interests</h2>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip
            v-for="(interest, i) in about.researchInterests"
            :key="i"
            closable
            @click:close="removeInterest(i)"
          >
            {{ interest }}
          </v-chip>
        </div>
        <div class="d-flex ga-2 mb-6">
          <v-text-field v-model="newInterest" label="Add interest" hide-details @keyup.enter="addInterest" />
          <v-btn color="primary" @click="addInterest">Add</v-btn>
        </div>

        <h2 class="text-h6 font-weight-bold mb-3">Education</h2>
        <v-card
          v-for="(edu, index) in about.education"
          :key="index"
          variant="outlined"
          class="pa-4 mb-3"
        >
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field v-model="edu.degree" label="Degree" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="edu.institution" label="Institution" />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model="edu.year" label="Year / Dates" />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn icon="mdi-delete" variant="text" color="error" @click="removeEducation(index)" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="edu.details" label="Details (optional)" />
            </v-col>
          </v-row>
        </v-card>
        <v-btn variant="tonal" prepend-icon="mdi-plus" class="mb-6" @click="addEducation">
          Add education
        </v-btn>

        <v-btn type="submit" color="primary" size="large" :loading="saving">
          Save about
        </v-btn>
      </v-form>
    </v-card>

    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      About page saved successfully.
    </v-snackbar>
  </div>
</template>
