<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'
// #region turf-import
import { area } from '@turf/area'
import { length } from '@turf/length'
import { polygonToLine } from '@turf/polygon-to-line'
// #endregion turf-import
import { bbox } from '@turf/bbox'
import { FillLayer, LineLayer, MapFloatingPanel } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './AreaPerimeterPage.vue?raw'

const PARCELS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/DOR_Parcel/FeatureServer/0'

type ParcelFeature = Feature<Polygon | MultiPolygon, { addr: string }>

const selectedParcel = ref<ParcelFeature | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const mapInstance = ref<any>(null)
const scriptSnippetHtml = ref('')

async function fetchParcelAt(lng: number, lat: number): Promise<ParcelFeature | null> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    f: 'geojson',
    returnGeometry: 'true',
    resultRecordCount: '1',
  })
  const url = `${PARCELS_SERVICE_URL}/query?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Parcel lookup failed: ${res.status}`)
  const data = (await res.json()) as FeatureCollection<Polygon | MultiPolygon>
  const f = data.features[0]
  if (!f) return null
  if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') return null
  return {
    ...f,
    properties: {
      addr: String(f.properties?.addr_std ?? f.properties?.comments ?? 'Unknown parcel'),
    },
  }
}

const onMapLoad = (m: unknown) => {
  mapInstance.value = m
}

const onMapClick = async (payload: { lngLat: { lng: number; lat: number } }) => {
  loading.value = true
  error.value = null
  try {
    const hit = await fetchParcelAt(payload.lngLat.lng, payload.lngLat.lat)
    selectedParcel.value = hit
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

// #region turf-usage
const areaSqFeet = computed<number | null>(() => {
  if (!selectedParcel.value) return null
  const sqMeters = area(selectedParcel.value)
  return sqMeters * 10.7639
})

const perimeterFeet = computed<number | null>(() => {
  if (!selectedParcel.value) return null
  const boundary = polygonToLine(selectedParcel.value)
  return length(boundary, { units: 'feet' })
})
// #endregion turf-usage

watch(selectedParcel, (next) => {
  if (!next || !mapInstance.value?.fitBounds) return
  mapInstance.value.fitBounds(bbox(next), { padding: 60, maxZoom: 18, duration: 500 })
})

const parcelSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedParcel.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

const formattedArea = computed(() => {
  const v = areaSqFeet.value
  return v === null ? '' : `${Math.round(v).toLocaleString()} sq ft`
})

const formattedPerimeter = computed(() => {
  const v = perimeterFeet.value
  return v === null ? '' : `${v.toFixed(1)} ft`
})

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
        title="area / perimeter"
        source-path="src/examples/area-perimeter/AreaPerimeterPage.vue"
      >
        <p>
          <code>area</code> takes a polygon (or multipolygon) and returns its
          area in square meters.
          <code>polygonToLine</code> turns a polygon's boundary into a
          LineString, and <code>length</code> measures that line — together,
          they give you a perimeter.
        </p>
        <p>
          Click anywhere in Philadelphia to look up the
          <abbr title="Department of Records">DOR</abbr> parcel that contains
          the click, then measure it.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load parcel: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap :zoom="13" @load="onMapLoad" @click="onMapClick">
        <FillLayer
          v-if="selectedParcel"
          id="parcel-fill"
          :source="parcelSource"
          :paint="{
            'fill-color': '#1d4ed8',
            'fill-opacity': 0.4,
          }"
        />
        <LineLayer
          v-if="selectedParcel"
          id="parcel-outline"
          :source="parcelSource"
          :paint="{
            'line-color': '#1e3a8a',
            'line-width': 2,
          }"
        />
        <MapFloatingPanel
          v-if="selectedParcel"
          position="top-left"
          :leave-room-for-controls="false"
          aria-label="Parcel measurements"
        >
          <div class="parcel-stats">
            <div class="parcel-addr">{{ selectedParcel.properties.addr }}</div>
            <dl>
              <div class="stat">
                <dt>Area</dt>
                <dd>{{ formattedArea }}</dd>
              </div>
              <div class="stat">
                <dt>Perimeter</dt>
                <dd>{{ formattedPerimeter }}</dd>
              </div>
            </dl>
          </div>
        </MapFloatingPanel>
      </DemoMap>

      <div v-if="loading" class="map-loading-overlay">
        <span class="spinner-large" />
        <span class="loading-text">Loading…</span>
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

.parcel-stats {
  font-family: inherit;
  font-size: 0.85rem;
  min-width: 12rem;
}

.parcel-addr {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-default, #0f1419);
}

.parcel-stats dl {
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 0.75rem;
  row-gap: 0.25rem;
}

.parcel-stats .stat {
  display: contents;
}

.parcel-stats dt {
  color: var(--color-text-secondary, #444);
  font-weight: 600;
}

.parcel-stats dd {
  margin: 0;
}

.map-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.65);
  z-index: 10;
  pointer-events: auto;
}

.spinner-large {
  width: 36px;
  height: 36px;
  border: 4px solid var(--color-border-default, #d4d8d9);
  border-top-color: var(--color-brand-primary, #0f4d90);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-default, #0f1419);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
