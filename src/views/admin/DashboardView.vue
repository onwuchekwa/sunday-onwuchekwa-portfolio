<script setup lang="ts">
const cards = [
  { title: 'Site Settings', description: 'Name, tagline, email, social links', icon: 'mdi-cog', to: '/admin/settings', color: 'primary' },
  { title: 'About', description: 'Bio, research interests, education', icon: 'mdi-account', to: '/admin/about', color: 'secondary' },
  { title: 'Publications', description: 'Manage papers, posters, and workshops', icon: 'mdi-book-open-variant', to: '/admin/publications', color: 'primary' },
  { title: 'News', description: 'Post updates and announcements', icon: 'mdi-newspaper', to: '/admin/news', color: 'accent' },
  { title: 'CV Builder', description: 'Build your live academic CV', icon: 'mdi-file-document-edit', to: '/admin/cv', color: 'secondary' },
]
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold text-primary mb-2">Dashboard</h1>
    <p class="text-body-1 text-medium-emphasis mb-8">
      Manage your portfolio content. Changes appear on the live site immediately.
    </p>

    <v-row>
      <v-col v-for="card in cards" :key="card.to" cols="12" sm="6" lg="4">
        <v-card :to="card.to" hover class="pa-6 h-100">
          <v-icon :icon="card.icon" :color="card.color" size="40" class="mb-4" />
          <h2 class="text-h6 font-weight-bold mb-2">{{ card.title }}</h2>
          <p class="text-body-2 text-medium-emphasis">{{ card.description }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
