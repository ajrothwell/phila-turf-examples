<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
// #region nearest-import
import { point } from '@turf/helpers'
import { nearestPoint } from '@turf/nearest-point'
// #endregion nearest-import
// #region voronoi-import
import { featureCollection } from '@turf/helpers'
import { voronoi } from '@turf/voronoi'
import { bbox } from '@turf/bbox'
import { intersect } from '@turf/intersect'
// #endregion voronoi-import
import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson'
import {
  CircleLayer,
  FillLayer,
  LineLayer,
  MapPopup,
  MapSearchControl,
} from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { highlight } from '../../lib/highlight'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './NearestPointPage.vue?raw'

const FARMERS_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Farmers_Markets/FeatureServer/0'
const CITY_LIMITS_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/City_Limits/FeatureServer/0'
const NAME_FIELD = 'name'

const markets = ref<FeatureCollection<Point> | null>(null)
const cityLimits = ref<Feature<Polygon | MultiPolygon> | null>(null)
const userLngLat = ref<[number, number] | null>(null)
const hoveredFeature = ref<Feature<Point> | null>(null)
const error = ref<string | null>(null)
const voronoiOn = ref(false)
const mapInstance = ref<any>(null)

const onMapLoad = (m: unknown) => {
  mapInstance.value = m
}

onMounted(async () => {
  try {
    const [marketsFc, cityFc] = await Promise.all([
      fetchAgolFeatures(FARMERS_SERVICE_URL),
      fetchAgolFeatures(CITY_LIMITS_URL),
    ])
    markets.value = marketsFc as FeatureCollection<Point>
    const first = cityFc.features[0]
    if (first && (first.geometry.type === 'Polygon' || first.geometry.type === 'MultiPolygon')) {
      cityLimits.value = first as Feature<Polygon | MultiPolygon>
    }
  } catch (e) {
    error.value = (e as Error).message
  }
})

// #region nearest-usage
const nearestIndex = computed<number | null>(() => {
  if (!markets.value || !userLngLat.value) return null
  const userPoint = point(userLngLat.value)
  const result = nearestPoint(userPoint, markets.value as FeatureCollection<Point>)
  return result.properties.featureIndex ?? null
})
// #endregion nearest-usage

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

// #region voronoi-usage
const voronoiCells = computed<FeatureCollection<Polygon | MultiPolygon> | null>(() => {
  if (!markets.value || !cityLimits.value) return null
  const cityBbox = bbox(cityLimits.value)
  const cells = voronoi(markets.value as FeatureCollection<Point>, { bbox: cityBbox })
  const clipped: Feature<Polygon | MultiPolygon>[] = []
  for (const cell of cells.features) {
    if (!cell) continue
    const result = intersect(
      featureCollection([cell, cityLimits.value]) as FeatureCollection<Polygon | MultiPolygon>,
    )
    if (result) clipped.push(result)
  }
  return featureCollection(clipped)
})
// #endregion voronoi-usage

const voronoiSource = computed(() => {
  return {
    type: 'geojson' as const,
    data: voronoiCells.value ?? { type: 'FeatureCollection' as const, features: [] },
  }
})

const popupFeature = computed<Feature<Point> | null>(() => {
  if (hoveredFeature.value) return hoveredFeature.value
  if (nearestIndex.value !== null && markets.value) {
    return markets.value.features[nearestIndex.value]
  }
  return null
})

const popupLngLat = computed<[number, number] | null>(() => {
  const f = popupFeature.value
  if (!f) return null
  const c = f.geometry.coordinates
  return [c[0], c[1]]
})

const popupName = computed<string>(() => {
  return String(popupFeature.value?.properties?.[NAME_FIELD] ?? '')
})

const onMapClick = (payload: { lngLat: { lng: number; lat: number } }) => {
  userLngLat.value = [payload.lngLat.lng, payload.lngLat.lat]
}

const onSearchResult = (result: unknown) => {
  const r = result as { geometry?: { coordinates?: [number, number] } }
  if (!r?.geometry?.coordinates) return
  userLngLat.value = r.geometry.coordinates

  const idx = nearestIndex.value
  if (idx === null || !markets.value || !mapInstance.value?.fitBounds) return
  const [uLng, uLat] = r.geometry.coordinates
  const [mLng, mLat] = markets.value.features[idx].geometry.coordinates
  mapInstance.value.fitBounds(
    [
      [Math.min(uLng, mLng), Math.min(uLat, mLat)],
      [Math.max(uLng, mLng), Math.max(uLat, mLat)],
    ],
    { padding: 120, maxZoom: 14, duration: 600 },
  )
}

const onCircleEnter = (e: any) => {
  const f = e.features?.[0]
  if (f) hoveredFeature.value = f as Feature<Point>
}

const onCircleLeave = () => {
  hoveredFeature.value = null
}

const nearestScriptHtml = ref('')
const nearestTemplateHtml = ref('')
const voronoiScriptHtml = ref('')
const voronoiTemplateHtml = ref('')
watchEffect(async () => {
  nearestScriptHtml.value = await highlight(
    extractRegions(pageSource, ['nearest-import', 'nearest-usage']),
    'ts',
  )
  nearestTemplateHtml.value = await highlight(
    extractRegions(pageSource, ['nearest-template']),
    'vue',
  )
  voronoiScriptHtml.value = await highlight(
    extractRegions(pageSource, ['voronoi-import', 'voronoi-usage']),
    'ts',
  )
  voronoiTemplateHtml.value = await highlight(
    extractRegions(pageSource, ['voronoi-template']),
    'vue',
  )
})
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="nearestPoint"
        source-path="src/examples/nearest-point/NearestPointPage.vue"
      >
        <p>
          <code>nearestPoint</code> takes a single point and a FeatureCollection
          of points and returns the closest one.
        </p>
        <p>
          Search an address (top-left of the map) or click anywhere on the map
          to drop your point. The nearest farmers market grows in size and its
          name popup pins open.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load markets: {{ error }}
        </p>
        <div class="snippet" v-html="nearestScriptHtml" />
        <p class="snippet-label">And in the template:</p>
        <div class="snippet" v-html="nearestTemplateHtml" />

        <section class="bonus">
          <div class="bonus-label">BONUS LESSON</div>
          <h2>Voronoi triangles</h2>
          <p>
            Toggle the button in the map's bottom-left to overlay the Voronoi
            diagram of the markets, clipped to Philly's city limits. Each
            polygon contains every point in the city closer to that market
            than to any other.
          </p>
          <div class="snippet" v-html="voronoiScriptHtml" />
          <p class="snippet-label">And in the template:</p>
          <div class="snippet" v-html="voronoiTemplateHtml" />
        </section>
      </CodePanel>
    </template>

    <template #map>
      <DemoMap @load="onMapLoad" @click="onMapClick">
        <MapSearchControl
          position="top-left"
          placeholder="Search a Philly address"
          :center-on-result="false"
          @result="onSearchResult"
        />
        <!-- #region voronoi-template -->
        <FillLayer
          v-if="voronoiOn"
          id="voronoi-fill"
          :source="voronoiSource"
          :paint="{
            'fill-color': '#555555',
            'fill-opacity': 0.15,
          }"
        />
        <LineLayer
          v-if="voronoiOn"
          id="voronoi-outline"
          :source="voronoiSource"
          :paint="{
            'line-color': '#222222',
            'line-width': 1.5,
            'line-opacity': 1,
          }"
        />
        <!-- #endregion voronoi-template -->

        <!-- #region nearest-template -->
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
        <!-- #endregion nearest-template -->

        <MapPopup v-if="popupLngLat" :lng-lat="popupLngLat" :close-on-click="false">
          <div style="padding: 4px 8px;">
            <strong>{{ popupName }}</strong>
          </div>
        </MapPopup>

        <CircleLayer
          v-if="userLngLat"
          id="user-point"
          :source="{
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: userLngLat },
                  properties: {},
                },
              ],
            },
          }"
          :paint="{
            'circle-radius': 8,
            'circle-color': '#2c3e50',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
          }"
        />
      </DemoMap>

      <button
        v-if="markets && cityLimits"
        class="voronoi-toggle"
        @click="voronoiOn = !voronoiOn"
      >
        {{ voronoiOn ? 'Hide' : 'Add' }} Voronoi triangles
      </button>
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

.bonus {
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 2px dashed var(--color-border-default, #d4d8d9);
}

.bonus-label {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-brand-primary, #0f4d90);
  background: rgba(15, 77, 144, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.bonus h2 {
  font-size: 1.05rem;
  margin: 0 0 0.25rem;
}

.voronoi-toggle {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 5;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid var(--color-border-default, #d4d8d9);
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-family: inherit;
}

.voronoi-toggle:hover {
  background: #f4f6f7;
}
</style>
