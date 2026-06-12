<script setup lang="ts">
withDefaults(
  defineProps<{
    imageUrl?: string
    size?: number | string
    iconSize?: number | string
    showBorder?: boolean
  }>(),
  {
    imageUrl: '',
    size: 40,
    iconSize: 24,
    showBorder: true,
  },
)
</script>

<template>
  <v-avatar :size="size" color="secondary" class="profile-avatar" :class="{ 'profile-avatar--bordered': showBorder }">
    <v-img
      v-if="imageUrl"
      :src="imageUrl"
      cover
      position="center center"
      alt="Profile photo"
    />
    <v-icon
      v-else
      icon="mdi-account"
      color="white"
      :size="iconSize"
    />
  </v-avatar>
</template>

<style scoped>
.profile-avatar--bordered {
  border: 2px solid rgba(255, 255, 255, 0.9);
}
</style>
