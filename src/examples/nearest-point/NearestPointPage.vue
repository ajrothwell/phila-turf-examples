<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { point } from '@turf/helpers'
import { nearestPoint } from '@turf/nearest-point'
import type { Feature, FeatureCollection, Point } from 'geojson'
import { CircleLayer, MapMarker, MapTooltip } from '@phila/phila-ui-map-core'
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
const hoveredFeature = ref<Feature<Point> | null>(null)
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

const marketsSource = computed(() => {
  if (!markets.value) {
    return { type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [] } }
  }
  const nIdx = nearestIndex.value
  const annotated: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: markets.value.features.map((f, i) => ({
      ...f,
      properties: { ...(f.properties ?? {}), isNearest: i === nIdx },
    })),
  }
  return { type: 'geojson' as const, data: annotated }
})

const tooltipFeature = computed<Feature<Point> | null>(() => {
  if (hoveredFeature.value) return hoveredFeature.value
  if (nearestIndex.value !== null && markets.value) {
    return markets.value.features[nearestIndex.value]
  }
  return null
})

const tooltipLngLat = computed<[number, number] | null>(() => {
  const f = tooltipFeature.value
  if (!f) return null
  const c = f.geometry.coordinates
  return [c[0], c[1]]
})

const tooltipName = computed<string>(() => {
  return String(tooltipFeature.value?.properties?.[NAME_FIELD] ?? '')
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

const onCircleEnter = (e: any) => {
  const f = e.features?.[0]
  if (f) hoveredFeature.value = f as Feature<Point>
}

const onCircleLeave = () => {
  hoveredFeature.value = null
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
        <CircleLayer
          id="markets"
          :source="marketsSource"
          :paint="{
            'circle-radius': ['case', ['==', ['get', 'isNearest'], true], 14, 6],
            'circle-color': ['case', ['==', ['get', 'isNearest'], true], '#27ae60', '#c0392b'],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          }"
          @mouseenter="onCircleEnter"
          @mouseleave="onCircleLeave"
        />

        <MapMarker v-if="tooltipLngLat" :lng-lat="tooltipLngLat">
          <MapTooltip :visible="true">{{ tooltipName }}</MapTooltip>
        </MapMarker>

        <!-- The user's clicked/searched point as a small distinct marker. -->
        <MapMarker v-if="userLngLat" :lng-lat="userLngLat">
          <div class="user-marker" />
        </MapMarker>
      </DemoMap>
    </template>
  </ExamplePage>
</template>

<style scoped>
.user-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #2c3e50;
  border: 3px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
</style>
