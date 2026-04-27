<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson'
// #region turf-import
import { centroid } from '@turf/centroid'
import { centerOfMass } from '@turf/center-of-mass'
import { pointOnFeature } from '@turf/point-on-feature'
// #endregion turf-import
import { bbox } from '@turf/bbox'
import { CircleLayer, FillLayer, LineLayer } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './CentroidPage.vue?raw'

const ZONING_OVERLAYS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Zoning_Overlays/FeatureServer/0'

type OverlayFeature = Feature<Polygon | MultiPolygon, { id: string; label: string }>
type Algorithm = 'centroid' | 'centerOfMass' | 'pointOnFeature'

const overlays = ref<OverlayFeature[]>([])
const selectedOverlayId = ref<string | null>(null)
const algorithm = ref<Algorithm>('centroid')
const error = ref<string | null>(null)
const loading = ref(true)
const mapInstance = ref<any>(null)
const scriptSnippetHtml = ref('')

onMounted(async () => {
  try {
    const fc = (await fetchAgolFeatures(ZONING_OVERLAYS_SERVICE_URL)) as FeatureCollection<
      Polygon | MultiPolygon
    >
    overlays.value = fc.features
      .filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
      )
      .map((f) => ({
        ...f,
        properties: {
          id: String(f.properties?.objectid ?? ''),
          label: String(f.properties?.overlay_name ?? '').replace(/^\//, ''),
        },
      }))
      .sort((a, b) => a.properties.label.localeCompare(b.properties.label))
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})

const onMapLoad = (m: unknown) => {
  mapInstance.value = m
}

const selectedOverlay = computed<OverlayFeature | null>(() => {
  if (!selectedOverlayId.value) return null
  return overlays.value.find((o) => o.properties.id === selectedOverlayId.value) ?? null
})

// #region turf-usage
const centerPoint = computed<Feature<Point> | null>(() => {
  if (!selectedOverlay.value) return null
  switch (algorithm.value) {
    case 'centroid':
      return centroid(selectedOverlay.value)
    case 'centerOfMass':
      return centerOfMass(selectedOverlay.value)
    case 'pointOnFeature':
      return pointOnFeature(selectedOverlay.value)
  }
})
// #endregion turf-usage

watch(selectedOverlay, (next) => {
  if (!next || !mapInstance.value?.fitBounds) return
  mapInstance.value.fitBounds(bbox(next), { padding: 80, maxZoom: 15, duration: 600 })
})

const overlaySource = computed(() => ({
  type: 'geojson' as const,
  data: selectedOverlay.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

const centerSource = computed(() => ({
  type: 'geojson' as const,
  data: centerPoint.value ?? { type: 'FeatureCollection' as const, features: [] },
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
        title="centroid / centerOfMass"
        source-path="src/examples/centroid/CentroidPage.vue"
      >
        <p>
          All three of these return a single point for a polygon — but they
          compute it differently.
          <code>centroid</code> averages the polygon's vertex coordinates —
          fast, but biased toward clusters of vertices on detailed edges.
          <code>centerOfMass</code> computes the polygon's true geometric
          center, balancing the shape as if it were cut from cardboard.
          Neither guarantees the point lands inside the polygon — for a
          MultiPolygon especially, it can fall in the gap between parts.
          <code>pointOnFeature</code> guarantees a point that's actually
          on the feature.
        </p>
        <p>
          Pick a zoning overlay from the dropdown, then switch the algorithm
          to see how the point moves — on irregular shapes and especially on
          MultiPolygons, the three answers can be very different.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load overlays: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap @load="onMapLoad">
        <FillLayer
          v-if="selectedOverlay"
          id="overlay-fill"
          :source="overlaySource"
          :paint="{
            'fill-color': '#3b82f6',
            'fill-opacity': 0.3,
          }"
        />
        <LineLayer
          v-if="selectedOverlay"
          id="overlay-outline"
          :source="overlaySource"
          :paint="{
            'line-color': '#1e40af',
            'line-width': 2,
          }"
        />
        <CircleLayer
          v-if="centerPoint"
          id="center-point"
          :source="centerSource"
          :paint="{
            'circle-radius': 8,
            'circle-color': '#c0392b',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2.5,
          }"
        />
      </DemoMap>

      <div class="centroid-control" @click.stop>
        <div class="control-block">
          <span class="control-label">Zoning overlay:</span>
          <div class="control-input">
            <select v-model="selectedOverlayId" :disabled="loading">
              <option v-if="loading" :value="null">Loading…</option>
              <template v-else>
                <option :value="null">none</option>
                <option v-for="o in overlays" :key="o.properties.id" :value="o.properties.id">
                  {{ o.properties.label }}
                </option>
              </template>
            </select>
            <span v-if="loading" class="spinner" aria-label="Loading overlays" />
          </div>
        </div>
        <div class="control-block">
          <span class="control-label">Algorithm:</span>
          <div class="control-input">
            <select v-model="algorithm">
              <option value="centroid">centroid</option>
              <option value="centerOfMass">centerOfMass</option>
              <option value="pointOnFeature">pointOnFeature</option>
            </select>
          </div>
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

.centroid-control {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  width: 22rem;
  background: #ffffff;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-family: inherit;
  font-size: 0.85rem;
}

.control-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.centroid-control .control-block + .control-block {
  margin-top: 0.5rem;
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

.centroid-control select {
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
