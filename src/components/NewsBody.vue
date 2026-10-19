<script setup lang="ts">
import { computed } from 'vue'
import { parseNewsBody } from '@/utils/news'
import NewsInline from '@/components/NewsInline.vue'

const props = defineProps<{
  body: string
}>()

const blocks = computed(() => parseNewsBody(props.body))
</script>

<template>
  <div class="news-body">
    <template v-for="(block, i) in blocks" :key="i">
      <h2 v-if="block.kind === 'heading' && block.level === 2" class="news-body__h2">
        <NewsInline :segments="block.segments" />
      </h2>
      <h3 v-else-if="block.kind === 'heading'" class="news-body__h3">
        <NewsInline :segments="block.segments" />
      </h3>
      <ul v-else-if="block.kind === 'list'" class="news-body__list">
        <li v-for="(item, j) in block.items" :key="j"><NewsInline :segments="item" /></li>
      </ul>
      <p v-else class="news-body__p"><NewsInline :segments="block.segments" /></p>
    </template>
  </div>
</template>

<style scoped>
.news-body__p,
.news-body__list {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--text-body);
  margin: 0 0 1rem;
  max-width: 68ch;
}

.news-body__p {
  white-space: pre-line;
}

.news-body__list {
  padding-left: 1.4rem;
}

.news-body__list li {
  margin-bottom: 0.25rem;
}

.news-body__h2 {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--heading);
  margin: 2rem 0 0.75rem;
}

.news-body__h3 {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--heading);
  margin: 1.5rem 0 0.5rem;
}

.news-body > :first-child {
  margin-top: 0;
}

.news-body :deep(a) {
  color: var(--accent) !important;
  overflow-wrap: anywhere;
  text-underline-offset: 3px;
}

.news-body :deep(strong) {
  color: var(--text-strong);
}
</style>
