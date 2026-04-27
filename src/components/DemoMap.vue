<script setup lang="ts">
import { Map as PhilaMap } from '@phila/phila-ui-map-core'

defineProps<{
  /** Override the default Philly center. */
  center?: [number, number]
  /** Override the default zoom. */
  zoom?: number
  /** If true, show the built-in MapSearchControl in the top-left. */
  withSearch?: boolean
}>()

const emit = defineEmits<{
  (e: 'load', map: unknown): void
  (e: 'click', payload: { lngLat: { lng: number; lat: number } }): void
  (e: 'searchResult', result: unknown): void
}>()
</script>

<template>
  <PhilaMap
    :center="center ?? [-75.1635, 39.9526]"
    :zoom="zoom ?? 12"
    :basemap-change-controls="{ toggle: true, position: 'top-right' }"
    :navigation-controls="{ position: 'top-right' }"
    :map-search-control="withSearch ? { position: 'top-left', placeholder: 'Search a Philly address' } : undefined"
    @load="(m: unknown) => emit('load', m)"
    @click="(payload: any) => emit('click', { lngLat: payload.lngLat })"
    @search-result="(r: unknown) => emit('searchResult', r)"
  >
    <slot />
  </PhilaMap>
</template>

<style scoped>
:deep(.maplibregl-map),
:deep(.mapboxgl-map) {
  position: absolute;
  inset: 0;
}
</style>
