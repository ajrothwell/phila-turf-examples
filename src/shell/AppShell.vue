<script setup lang="ts">
import { AppHeader } from '@phila/phila-ui-app-header'
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader
      id="app-header"
      :show-trusted-site="false"
      :sticky="false"
      :navbar-brand="{
        brandingLink: { text: 'Phila Turf Examples', href: '/' },
      }"
    />
    <div class="below-header">
      <Sidebar />
      <main class="main-area">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.below-header {
  flex: 1;
  min-height: 0;
  display: flex;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  /* Edge-to-edge: NO padding here. The example page fills this. */
}

#app-header :deep(.phila-navbar-brand) {
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

#app-header :deep(.phila-navbar-brand a) {
  font-size: 1.35rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.01em;
  padding: 0.5rem 0;
}

#app-header :deep(.phila-navbar-brand a:hover) {
  text-decoration: none;
  opacity: 0.85;
}
</style>
