<template>
  <div class="example-page">
    <aside class="code-panel">
      <slot name="code" />
    </aside>
    <section class="map-panel">
      <slot name="map" />
    </section>
  </div>
</template>

<style scoped>
.example-page {
  display: flex;
  flex: 1;
  min-width: 0;
  /* No padding — edge-to-edge. */
}

.code-panel {
  width: 480px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-default, #d4d8d9);
  background: var(--color-surface-elevated, #f8f9fa);
  overflow-y: auto;
  padding: 1.25rem;
}

.map-panel {
  flex: 1;
  min-width: 0;
  position: relative;
  /* Map-core's <Map> is positioned absolute inside this. */
}
</style>
