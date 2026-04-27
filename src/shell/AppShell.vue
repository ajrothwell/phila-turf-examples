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
</style>

<style>
.phila-navbar-brand {
  padding-left: 1.25rem !important;
  padding-right: 1.25rem !important;
}

.phila-navbar-brand-link {
  font-size: 1.35rem !important;
  font-weight: 700 !important;
  text-decoration: none !important;
  letter-spacing: 0.01em !important;
  padding: 0.5rem 0 !important;
}

.phila-navbar-brand-link:hover {
  text-decoration: none !important;
  opacity: 0.85 !important;
}
</style>
