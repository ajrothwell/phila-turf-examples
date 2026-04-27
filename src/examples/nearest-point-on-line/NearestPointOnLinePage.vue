<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson'
// #region turf-import
import { combine } from '@turf/combine'
import { nearestPointOnLine } from '@turf/nearest-point-on-line'
import { featureCollection, point } from '@turf/helpers'
// #endregion turf-import
import {
  CircleLayer,
  LineLayer,
  GeolocationButton,
} from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './NearestPointOnLinePage.vue?raw'

const BIKE_NETWORK_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Bike_Network/FeatureServer/0'

type SegmentFeature = Feature<LineString, { streetname: string }>

const segments = ref<SegmentFeature[]>([])
const selectedStreet = ref<string | null>(null)
const userLngLat = ref<[number, number] | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)
const scriptSnippetHtml = ref('')

const normalizeStreet = (raw: string) => raw.replace(/\s+/g, ' ').trim()

onMounted(async () => {
  try {
    const fc = (await fetchAgolFeatures(BIKE_NETWORK_SERVICE_URL)) as FeatureCollection<LineString>
    segments.value = fc.features
      .filter((f): f is Feature<LineString> => f.geometry.type === 'LineString')
      .map((f) => ({
        ...f,
        properties: { streetname: normalizeStreet(String(f.properties?.streetname ?? '')) },
      }))
      .filter((f) => f.properties.streetname.length > 0)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})

const streetnames = computed<string[]>(() => {
  const set = new Set(segments.value.map((s) => s.properties.streetname))
  return [...set].sort()
})

// #region turf-usage
const selectedLine = computed<Feature<MultiLineString> | null>(() => {
  if (!selectedStreet.value) return null
  const matching = segments.value.filter((s) => s.properties.streetname === selectedStreet.value)
  if (matching.length === 0) return null
  return combine(featureCollection(matching)).features[0] as Feature<MultiLineString>
})

const snappedPoint = computed<Feature<Point> | null>(() => {
  if (!selectedLine.value || !userLngLat.value) return null
  return nearestPointOnLine(selectedLine.value, point(userLngLat.value), { units: 'miles' })
})
// #endregion turf-usage

const allBikeSource = computed(() => ({
  type: 'geojson' as const,
  data: { type: 'FeatureCollection' as const, features: segments.value },
}))

const selectedLineSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedLine.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

const userPointSource = computed(() => ({
  type: 'geojson' as const,
  data: userLngLat.value
    ? {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: userLngLat.value },
        properties: {},
      }
    : { type: 'FeatureCollection' as const, features: [] },
}))

const snappedPointSource = computed(() => ({
  type: 'geojson' as const,
  data: snappedPoint.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

const connectorSource = computed(() => {
  if (!userLngLat.value || !snappedPoint.value) {
    return { type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [] } }
  }
  return {
    type: 'geojson' as const,
    data: {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [userLngLat.value, snappedPoint.value.geometry.coordinates],
      },
      properties: {},
    },
  }
})

const snapDistance = computed<string | null>(() => {
  const miles = snappedPoint.value?.properties?.dist
  if (typeof miles !== 'number') return null
  return `${miles.toFixed(2)} mi`
})

const onLocated = (data: { longitude: number; latitude: number }) => {
  userLngLat.value = [data.longitude, data.latitude]
}

watchEffect(async () => {
  scriptSnippetHtml.value = await highlight(
    extractRegions(pageSource, ['turf-import', 'turf-usage']),
    'ts',
  )
})
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="nearestPointOnLine"
        source-path="src/examples/nearest-point-on-line/NearestPointOnLinePage.vue"
      >
        <p>
          <code>nearestPointOnLine</code> takes a line (LineString or
          MultiLineString) and a point, and returns the closest point on the
          line plus the distance to it. Useful for snapping a click — or a
          user's location — to a road, rail, or trail network.
        </p>
        <p>
          The Bike Network has 5,000+ short segments, so first we filter to
          one street and use <code>combine</code> to merge those segments into
          a single MultiLineString. Then one <code>nearestPointOnLine</code>
          call snaps your location to the closest point on that street's bike
          line.
        </p>
        <p>
          Pick a street from the dropdown, then click the geolocate button on
          the map.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load bike network: {{ error }}
        </p>
        <p v-if="snapDistance">
          Closest point on <strong>{{ selectedStreet }}</strong>:
          <strong>{{ snapDistance }}</strong> away.
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap :zoom="11">
        <LineLayer
          id="all-bike"
          :source="allBikeSource"
          :paint="{
            'line-color': '#9aa1a3',
            'line-width': 1.5,
            'line-opacity': 0.7,
          }"
        />
        <LineLayer
          v-if="selectedLine"
          id="selected-street"
          :source="selectedLineSource"
          :paint="{
            'line-color': '#1d4ed8',
            'line-width': 4,
          }"
        />
        <LineLayer
          v-if="snappedPoint && userLngLat"
          id="connector"
          :source="connectorSource"
          :paint="{
            'line-color': '#555',
            'line-width': 1.5,
            'line-dasharray': [3, 3],
          }"
        />
        <CircleLayer
          v-if="userLngLat"
          id="user-point"
          :source="userPointSource"
          :paint="{
            'circle-radius': 8,
            'circle-color': '#c0392b',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2.5,
          }"
        />
        <CircleLayer
          v-if="snappedPoint"
          id="snapped-point"
          :source="snappedPointSource"
          :paint="{
            'circle-radius': 8,
            'circle-color': '#27ae60',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2.5,
          }"
        />
        <GeolocationButton
          position="bottom-right"
          :track-user="false"
          @located="onLocated"
        />
      </DemoMap>

      <div class="street-control" @click.stop>
        <span class="control-label">Bike street:</span>
        <div class="control-input">
          <select v-model="selectedStreet" :disabled="loading">
            <option v-if="loading" :value="null">Loading…</option>
            <template v-else>
              <option :value="null">none</option>
              <option v-for="s in streetnames" :key="s" :value="s">
                {{ s }}
              </option>
            </template>
          </select>
          <span v-if="loading" class="spinner" aria-label="Loading bike network" />
        </div>
      </div>
    </template>
  </ExamplePage>
</template>

<style scoped>
.snippet {
  font-size: 0.85rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  overflow-x: auto;
  background: #fff;
  margin-top: 0.5rem;
}

.snippet :deep(pre) {
  margin: 0;
  padding: 0.75rem 1rem;
  background: transparent !important;
}

.street-control {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  width: 18rem;
  background: #ffffff;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-family: inherit;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.control-label {
  font-weight: 600;
  color: var(--color-text-default, #0f1419);
}

.control-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.street-control select {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
  background: #fff;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border-default, #d4d8d9);
  border-top-color: var(--color-brand-primary, #0f4d90);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
