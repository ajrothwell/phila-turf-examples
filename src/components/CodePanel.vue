<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { highlight } from '../lib/highlight'

const props = defineProps<{
  /** Page title shown above the prose intro. */
  title: string
  /** The curated Turf snippet (string of TypeScript). */
  snippet: string
  /** Path within the repo to the example's .vue file (used for the GitHub link). */
  sourcePath: string
}>()

const REPO_BASE = 'https://github.com/ajrothwell/phila-turf-examples/blob/main'
const githubUrl = `${REPO_BASE}/${props.sourcePath}`

const highlighted = ref<string>('')

watchEffect(async () => {
  highlighted.value = await highlight(props.snippet, 'ts')
})
</script>

<template>
  <div class="code-panel-inner">
    <h1>{{ title }}</h1>
    <div class="prose">
      <slot />
    </div>
    <div class="snippet" v-html="highlighted" />
    <a class="source-link" :href="githubUrl" target="_blank" rel="noreferrer">
      View full source on GitHub →
    </a>
  </div>
</template>

<style scoped>
.code-panel-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.95rem;
}

h1 {
  font-size: 1.25rem;
  margin: 0;
}

.prose {
  color: var(--color-text-secondary, #444);
  line-height: 1.5;
}

.snippet {
  font-size: 0.85rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  overflow-x: auto;
  background: #fff;
}

.snippet :deep(pre) {
  margin: 0;
  padding: 1rem;
  background: transparent !important;
}

.source-link {
  font-size: 0.85rem;
  align-self: flex-start;
}
</style>
