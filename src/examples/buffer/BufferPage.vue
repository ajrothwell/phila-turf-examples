<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'
import { point } from '@turf/helpers'
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'
// #region turf-import
import { buffer } from '@turf/buffer'
// #endregion turf-import
import { bbox } from '@turf/bbox'
import { FillLayer, LineLayer } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './BufferPage.vue?raw'

const ZIPCODES_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Zipcodes_Poly/FeatureServer/0'
const ZIP_FIELD = 'code'

type ZipFeature = Feature<Polygon | MultiPolygon, { zipcode: string }>

const zipFeatures = ref<ZipFeature[]>([])
const selectedZip = ref<ZipFeature | null>(null)
const bufferMiles = ref<1 | 2 | 3 | 4>(1)
const searchInput = ref('')
const searchError = ref<string | null>(null)
const error = ref<string | null>(null)
const mapInstance = ref<any>(null)
const scriptSnippetHtml = ref('')
const templateSnippetHtml = ref('')

onMounted(async () => {
  try {
    const fc = (await fetchAgolFeatures(ZIPCODES_SERVICE_URL)) as FeatureCollection<
      Polygon | MultiPolygon
    >
    zipFeatures.value = fc.features
      .filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
      )
      .map((f) => ({
        ...f,
        properties: {
          zipcode: String(f.properties?.[ZIP_FIELD] ?? ''),
        },
      }))
  } catch (e) {
    error.value = (e as Error).message
  }
})

const onMapLoad = (m: unknown) => {
  mapInstance.value = m
}

const onMapClick = (payload: { lngLat: { lng: number; lat: number } }) => {
  const click = point([payload.lngLat.lng, payload.lngLat.lat])
  const hit = zipFeatures.value.find((z) => booleanPointInPolygon(click, z))
  if (hit) selectedZip.value = hit
}

const onSearchSubmit = () => {
  const code = searchInput.value.trim()
  if (!/^\d{5}$/.test(code)) {
    searchError.value = 'Enter a 5-digit zipcode'
    return
  }
  const hit = zipFeatures.value.find((z) => z.properties.zipcode === code)
  if (!hit) {
    searchError.value = 'No zipcode found'
    return
  }
  searchError.value = null
  selectedZip.value = hit
}

const onSearchInput = () => {
  if (searchError.value) searchError.value = null
}

const selectedSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedZip.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

// #region turf-usage
const bufferedFeature = computed<Feature<Polygon | MultiPolygon> | null>(() => {
  if (!selectedZip.value) return null
  const result = buffer(selectedZip.value, bufferMiles.value, { units: 'miles' })
  return result ?? null
})
// #endregion turf-usage

const bufferSource = computed(() => ({
  type: 'geojson' as const,
  data: bufferedFeature.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

watch(bufferedFeature, (next) => {
  if (!next || !mapInstance.value?.fitBounds) return
  const [minX, minY, maxX, maxY] = bbox(next)
  mapInstance.value.fitBounds(
    [
      [minX, minY],
      [maxX, maxY],
    ],
    { padding: 80, maxZoom: 13, duration: 600 },
  )
})

watchEffect(async () => {
  scriptSnippetHtml.value = await highlight(
    extractRegions(pageSource, ['turf-import', 'turf-usage']),
    'ts',
  )
  templateSnippetHtml.value = await highlight(
    extractRegions(pageSource, ['turf-template']),
    'vue',
  )
})
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="buffer"
        source-path="src/examples/buffer/BufferPage.vue"
      >
        <p>
          <code>buffer</code> grows a polygon outward by a fixed distance. Click
          the map or type a 5-digit zipcode to pick a Philadelphia zipcode and
          see it grow.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load zipcodes: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
        <p class="snippet-label">And in the template:</p>
        <div class="snippet" v-html="templateSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <!-- #region turf-template -->
      <DemoMap @load="onMapLoad" @click="onMapClick">
        <FillLayer
          v-if="bufferedFeature"
          id="buffer-fill"
          :source="bufferSource"
          :paint="{
            'fill-color': '#3b82f6',
            'fill-opacity': 0.25,
          }"
        />
        <LineLayer
          v-if="bufferedFeature"
          id="buffer-outline"
          :source="bufferSource"
          :paint="{
            'line-color': '#1e40af',
            'line-width': 1.5,
          }"
        />
        <!-- #endregion turf-template -->
        <FillLayer
          v-if="selectedZip"
          id="selected-zip-fill"
          :source="selectedSource"
          :paint="{
            'fill-color': '#1d4ed8',
            'fill-opacity': 0.4,
          }"
        />
        <LineLayer
          v-if="selectedZip"
          id="selected-zip-outline"
          :source="selectedSource"
          :paint="{
            'line-color': '#1e3a8a',
            'line-width': 2,
          }"
        />
      </DemoMap>

      <div class="buffer-control" @click.stop>
        <form class="control-row" @submit.prevent="onSearchSubmit">
          <input
            v-model="searchInput"
            type="text"
            inputmode="numeric"
            maxlength="5"
            placeholder="ZIP code"
            class="zip-input"
            @input="onSearchInput"
          />
          <button type="submit" class="zip-submit">Go</button>
        </form>
        <div v-if="searchError" class="zip-error">{{ searchError }}</div>
        <label class="control-row">
          <span class="control-label">Buffer:</span>
          <select v-model.number="bufferMiles">
            <option :value="1">1 mile</option>
            <option :value="2">2 miles</option>
            <option :value="3">3 miles</option>
            <option :value="4">4 miles</option>
          </select>
        </label>
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

.snippet-label {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary, #444);
}

.buffer-control {
  position: absolute;
  top: 12px;
  right: 56px;
  z-index: 5;
  background: #ffffff;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-family: inherit;
  font-size: 0.85rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.buffer-control .control-row + .control-row {
  margin-top: 0.5rem;
}

.control-label {
  font-weight: 600;
  color: var(--color-text-default, #0f1419);
}

.buffer-control select {
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
  background: #fff;
}

.zip-input {
  width: 10ch;
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
}

.zip-submit {
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
  background: #f4f6f7;
  cursor: pointer;
}

.zip-submit:hover {
  background: #e6eaeb;
}

.zip-error {
  color: var(--color-text-error, #b21d10);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
