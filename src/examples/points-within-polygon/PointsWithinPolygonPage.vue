<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson'
// #region turf-import
import { pointsWithinPolygon } from '@turf/points-within-polygon'
// #endregion turf-import
import { featureCollection } from '@turf/helpers'
import { CircleLayer, FillLayer, LineLayer, MapFloatingPanel } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './PointsWithinPolygonPage.vue?raw'

const HOSPITALS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Hospitals/FeatureServer/0'
const POLICE_STATIONS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Police_Stations/FeatureServer/0'
const PSAS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Boundaries_PSA/FeatureServer/0'

type PsaFeature = Feature<Polygon | MultiPolygon, { psaNum: string; label: string }>

const hospitals = ref<FeatureCollection<Point> | null>(null)
const policeStations = ref<FeatureCollection<Point> | null>(null)
const psas = ref<PsaFeature[]>([])
const selectedPsaNum = ref<string | null>(null)
const error = ref<string | null>(null)
const scriptSnippetHtml = ref('')
const templateSnippetHtml = ref('')

onMounted(async () => {
  try {
    const [hospitalsFc, policeStationsFc, psasFc] = await Promise.all([
      fetchAgolFeatures(HOSPITALS_SERVICE_URL),
      fetchAgolFeatures(POLICE_STATIONS_SERVICE_URL),
      fetchAgolFeatures(PSAS_SERVICE_URL),
    ])
    hospitals.value = hospitalsFc as FeatureCollection<Point>
    policeStations.value = policeStationsFc as FeatureCollection<Point>
    psas.value = (psasFc as FeatureCollection<Polygon | MultiPolygon>).features
      .filter(
        (f): f is Feature<Polygon | MultiPolygon> =>
          f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
      )
      .map((f) => {
        const num = String(f.properties?.psa_num ?? '')
        return {
          ...f,
          properties: { psaNum: num, label: `PSA ${num}` },
        }
      })
      .sort((a, b) => Number(a.properties.psaNum) - Number(b.properties.psaNum))
  } catch (e) {
    error.value = (e as Error).message
  }
})

const selectedPsa = computed<PsaFeature | null>(() => {
  if (!selectedPsaNum.value) return null
  return psas.value.find((p) => p.properties.psaNum === selectedPsaNum.value) ?? null
})

// #region turf-usage
const visibleHospitals = computed<FeatureCollection<Point>>(() => {
  if (!hospitals.value) return featureCollection<Point>([])
  if (!selectedPsa.value) return hospitals.value
  return pointsWithinPolygon(hospitals.value, selectedPsa.value) as FeatureCollection<Point>
})

const visiblePoliceStations = computed<FeatureCollection<Point>>(() => {
  if (!policeStations.value) return featureCollection<Point>([])
  if (!selectedPsa.value) return policeStations.value
  return pointsWithinPolygon(policeStations.value, selectedPsa.value) as FeatureCollection<Point>
})
// #endregion turf-usage

const hospitalsSource = computed(() => ({
  type: 'geojson' as const,
  data: visibleHospitals.value,
}))

const policeStationsSource = computed(() => ({
  type: 'geojson' as const,
  data: visiblePoliceStations.value,
}))

const psaSource = computed(() => ({
  type: 'geojson' as const,
  data: selectedPsa.value ?? { type: 'FeatureCollection' as const, features: [] },
}))

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
        title="pointsWithinPolygon"
        source-path="src/examples/points-within-polygon/PointsWithinPolygonPage.vue"
      >
        <p>
          <code>pointsWithinPolygon</code> takes a FeatureCollection of points
          and a polygon, and returns a feature collection of just the points
          that fall inside the polygon.
        </p>
        <p>
          Below: every hospital and every police station in Philly. Pick a
          Police Service Area from the dropdown — the map shows that PSA's
          boundary, and the hospital and station lists collapse to just those
          inside it.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load layers: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
        <p class="snippet-label">And in the template:</p>
        <div class="snippet" v-html="templateSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap :zoom="10">
        <FillLayer
          v-if="selectedPsa"
          id="psa-fill"
          :source="psaSource"
          :paint="{
            'fill-color': '#0f4d90',
            'fill-opacity': 0.15,
          }"
        />
        <LineLayer
          v-if="selectedPsa"
          id="psa-outline"
          :source="psaSource"
          :paint="{
            'line-color': '#0f4d90',
            'line-width': 2,
          }"
        />
        <!-- #region turf-template -->
        <CircleLayer
          id="hospitals"
          :source="hospitalsSource"
          :paint="{
            'circle-radius': 7,
            'circle-color': '#c0392b',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          }"
        />
        <CircleLayer
          id="police-stations"
          :source="policeStationsSource"
          :paint="{
            'circle-radius': 7,
            'circle-color': '#1d4ed8',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          }"
        />
        <!-- #endregion turf-template -->

        <MapFloatingPanel
          position="bottom-left"
          :leave-room-for-controls="false"
          aria-label="Map legend"
        >
          <div class="legend">
            <div class="legend-row">
              <span class="legend-swatch" style="background: #c0392b;" />
              <span>Hospitals</span>
            </div>
            <div class="legend-row">
              <span class="legend-swatch" style="background: #1d4ed8;" />
              <span>Police stations</span>
            </div>
          </div>
        </MapFloatingPanel>
      </DemoMap>

      <div class="psa-control" @click.stop>
        <label class="control-row">
          <span class="control-label">Select a Police Service Area:</span>
          <select v-model="selectedPsaNum">
            <option :value="null">none</option>
            <option v-for="p in psas" :key="p.properties.psaNum" :value="p.properties.psaNum">
              {{ p.properties.label }}
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

.snippet-label {
  margin: 0.75rem 0 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary, #444);
}

.psa-control {
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

.control-label {
  font-weight: 600;
  color: var(--color-text-default, #0f1419);
}

.psa-control select {
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 3px;
  background: #fff;
  max-width: 14rem;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--color-text-default, #0f1419);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}
</style>
