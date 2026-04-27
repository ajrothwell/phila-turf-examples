<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { point } from '@turf/helpers'
import { nearestPoint } from '@turf/nearest-point'
import type { FeatureCollection, Point } from 'geojson'
import { MapMarker, MapTooltip } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { TURF_SNIPPET } from './snippet'

const FARMERS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Farmers_Markets/FeatureServer/0'
const NAME_FIELD = 'name'

const markets = ref<FeatureCollection<Point> | null>(null)
const userLngLat = ref<[number, number] | null>(null)
const hoveredId = ref<string | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const fc = await fetchAgolFeatures(FARMERS_SERVICE_URL)
    markets.value = fc as FeatureCollection<Point>
  } catch (e) {
    error.value = (e as Error).message
  }
})

// nearest market index (computed from Turf)
const nearestIndex = computed<number | null>(() => {
  if (!markets.value || !userLngLat.value) return null
  const userPoint = point(userLngLat.value)
  const result = nearestPoint(userPoint, markets.value as FeatureCollection<Point>)
  return result.properties.featureIndex ?? null
})

const onMapClick = (payload: { lngLat: { lng: number; lat: number } }) => {
  userLngLat.value = [payload.lngLat.lng, payload.lngLat.lat]
}

const onSearchResult = (result: unknown) => {
  // map-core's @search-result emits the AisGeocodeResult shape:
  // { geometry: { coordinates: [lng, lat] }, properties: {...} }
  const r = result as { geometry?: { coordinates?: [number, number] } }
  if (r?.geometry?.coordinates) {
    userLngLat.value = r.geometry.coordinates
  }
}

const marketName = (idx: number) => {
  return markets.value?.features[idx]?.properties?.[NAME_FIELD] ?? `Market ${idx + 1}`
}

const marketLngLat = (idx: number): [number, number] => {
  const c = markets.value!.features[idx].geometry.coordinates
  return [c[0], c[1]]
}
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="nearestPoint"
        :snippet="TURF_SNIPPET"
        source-path="src/examples/nearest-point/NearestPointPage.vue"
      >
        <p>
          <code>nearestPoint</code> takes a single point and a FeatureCollection
          of points and returns the closest one.
        </p>
        <p>
          Search an address (top-left of the map) or click anywhere on the map
          to drop your point. The nearest farmers market grows in size and its
          name tooltip pins open.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load markets: {{ error }}
        </p>
      </CodePanel>
    </template>

    <template #map>
      <DemoMap with-search @click="onMapClick" @search-result="onSearchResult">
        <!-- Each market as its own MapMarker so we can attach a tooltip. -->
        <template v-if="markets">
          <MapMarker
            v-for="(_, idx) in markets.features"
            :key="idx"
            :lng-lat="marketLngLat(idx)"
          >
            <div
              class="circle-marker"
              :class="{ 'is-nearest': idx === nearestIndex }"
              @mouseenter="hoveredId = String(idx)"
              @mouseleave="hoveredId = null"
            />
            <MapTooltip :visible="hoveredId === String(idx) || idx === nearestIndex">
              {{ marketName(idx) }}
            </MapTooltip>
          </MapMarker>
        </template>

        <!-- The user's clicked/searched point as a small distinct marker. -->
        <MapMarker v-if="userLngLat" :lng-lat="userLngLat">
          <div class="user-marker" />
        </MapMarker>
      </DemoMap>
    </template>
  </ExamplePage>
</template>

<style scoped>
.circle-marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #c0392b;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: width 200ms ease, height 200ms ease;
}

.circle-marker.is-nearest {
  width: 28px;
  height: 28px;
  background: #27ae60;
}

.user-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #2c3e50;
  border: 3px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
</style>
