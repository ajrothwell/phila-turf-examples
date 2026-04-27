<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { BBox, Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'
// #region turf-import
import { bbox } from '@turf/bbox'
import { featureCollection } from '@turf/helpers'
// #endregion turf-import
import { FillLayer, LineLayer } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './BboxPage.vue?raw'

const WARDS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Political_Wards/FeatureServer/0'
const TRACTS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Census_Tracts_2020/FeatureServer/0'

type WardFeature = Feature<Polygon | MultiPolygon, { id: string; label: string }>
type TractFeature = Feature<Polygon | MultiPolygon, { id: string; label: string }>

const wards = ref<WardFeature[]>([])
const tracts = ref<TractFeature[]>([])
const selectedWardId = ref<string | null>(null)
const selectedTractId = ref<string | null>(null)
const error = ref<string | null>(null)
const mapInstance = ref<any>(null)
const scriptSnippetHtml = ref('')

onMounted(async () => {
  try {
    const [wardsFc, tractsFc] = await Promise.all([
      fetchAgolFeatures(WARDS_SERVICE_URL),
      fetchAgolFeatures(TRACTS_SERVICE_URL),
    ])
    wards.value = (wardsFc as FeatureCollection<Polygon | MultiPolygon>).features
      .filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
      )
      .map((f) => {
        const num = String(f.properties?.ward_num ?? '')
        return {
          ...f,
          properties: { id: num, label: `Ward ${num}` },
        }
      })
      .sort((a, b) => Number(a.properties.id) - Number(b.properties.id))

    tracts.value = (tractsFc as FeatureCollection<Polygon | MultiPolygon>).features
      .filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
      )
      .map((f) => ({
        ...f,
        properties: {
          id: String(f.properties?.GEOID ?? ''),
          label: String(f.properties?.NAMELSAD ?? ''),
        },
      }))
      .sort((a, b) => a.properties.label.localeCompare(b.properties.label, 'en', { numeric: true }))
  } catch (e) {
    error.value = (e as Error).message
  }
})

const onMapLoad = (m: unknown) => {
  mapInstance.value = m
}

const selectedWard = computed<WardFeature | null>(() => {
  if (!selectedWardId.value) return null
  return wards.value.find((w) => w.properties.id === selectedWardId.value) ?? null
})

const selectedTract = computed<TractFeature | null>(() => {
  if (!selectedTractId.value) return null
  return tracts.value.find((t) => t.properties.id === selectedTractId.value) ?? null
})

// #region turf-usage
const combinedBbox = computed<BBox | null>(() => {
  const features: Feature<Polygon | MultiPolygon>[] = []
  if (selectedWard.value) features.push(selectedWard.value)
  if (selectedTract.value) features.push(selectedTract.value)
  if (features.length === 0) return null
  return bbox(featureCollection(features))
})

watch(combinedBbox, (next) => {
  if (!next || !mapInstance.value?.fitBounds) return
  mapInstance.value.fitBounds(next, { padding: 80, maxZoom: 14, duration: 600 })
})
// #endregion turf-usage

const wardSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedWard.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

const tractSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedTract.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

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
        title="bbox"
        source-path="src/examples/bbox/BboxPage.vue"
      >
        <p>
          <code>bbox</code> takes any feature or feature collection and returns
          its bounding box as <code>[minLng, minLat, maxLng, maxLat]</code>.
        </p>
        <p>
          A common use: find the box around two things you want on screen at
          once, then call <code>map.fitBounds()</code> on it. Pick a ward and a
          census tract from the dropdowns — the map zooms to fit whatever
          you've selected.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load layers: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap @load="onMapLoad">
        <FillLayer
          v-if="selectedWard"
          id="ward-fill"
          :source="wardSource"
          :paint="{
            'fill-color': '#3b82f6',
            'fill-opacity': 0.4,
          }"
        />
        <LineLayer
          v-if="selectedWard"
          id="ward-outline"
          :source="wardSource"
          :paint="{
            'line-color': '#1e40af',
            'line-width': 2,
          }"
        />
        <FillLayer
          v-if="selectedTract"
          id="tract-fill"
          :source="tractSource"
          :paint="{
            'fill-color': '#10b981',
            'fill-opacity': 0.4,
          }"
        />
        <LineLayer
          v-if="selectedTract"
          id="tract-outline"
          :source="tractSource"
          :paint="{
            'line-color': '#047857',
            'line-width': 2,
          }"
        />
      </DemoMap>

      <div class="bbox-control" @click.stop>
        <label class="control-row">
          <span class="control-label">Ward:</span>
          <select v-model="selectedWardId">
            <option :value="null">— none —</option>
            <option v-for="w in wards" :key="w.properties.id" :value="w.properties.id">
              {{ w.properties.label }}
            </option>
          </select>
        </label>
        <label class="control-row">
          <span class="control-label">Tract:</span>
          <select v-model="selectedTractId">
            <option :value="null">— none —</option>
            <option v-for="t in tracts" :key="t.properties.id" :value="t.properties.id">
              {{ t.properties.label }}
            </option>
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

.bbox-control {
  position: absolute;
  top: 12px;
  left: 12px;
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

.bbox-control .control-row + .control-row {
  margin-top: 0.5rem;
}

.control-label {
  font-weight: 600;
  color: var(--color-text-default, #0f1419);
  min-width: 3.5rem;
}

.bbox-control select {
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
  background: #fff;
  max-width: 14rem;
}
</style>
