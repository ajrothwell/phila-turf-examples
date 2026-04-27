<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { point } from '@turf/helpers'
import { distance } from '@turf/distance'
import { faSnowflake } from '@fortawesome/free-solid-svg-icons'
import type { Feature, FeatureCollection, Point } from 'geojson'
import { CircleLayer, MapMarker, MapIconTextPin, MapPopup } from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { TURF_SNIPPET } from './snippet'

const RINKS_SERVICE_URL =
  'https://services.arcgis.com/6fiE7QkLWSPMd0N5/arcgis/rest/services/IceRinks/FeatureServer/0'
const NAME_FIELD = 'AMENITY_NA'

const rinks = ref<FeatureCollection<Point> | null>(null)
const userLngLat = ref<[number, number] | null>(null)
const hoveredIdx = ref<number | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    rinks.value = (await fetchAgolFeatures(RINKS_SERVICE_URL)) as FeatureCollection<Point>
  } catch (e) {
    error.value = (e as Error).message
  }
})

const rinkName = (idx: number): string => {
  return String(rinks.value?.features[idx]?.properties?.[NAME_FIELD] ?? `Rink ${idx + 1}`)
}

const rinkLngLat = (idx: number): [number, number] => {
  const c = rinks.value!.features[idx].geometry.coordinates
  return [c[0], c[1]]
}

const labels = computed<string[]>(() => {
  if (!rinks.value) return []
  return rinks.value.features.map((rink, idx) => {
    const name = rinkName(idx)
    if (!userLngLat.value) return name
    const miles = distance(point(userLngLat.value), rink as Feature<Point>, { units: 'miles' })
    return `${name} — ${miles.toFixed(2)} mi`
  })
})

const onMapClick = (payload: { lngLat: { lng: number; lat: number } }) => {
  userLngLat.value = [payload.lngLat.lng, payload.lngLat.lat]
}

const onSearchResult = (result: unknown) => {
  const r = result as { geometry?: { coordinates?: [number, number] } }
  if (r?.geometry?.coordinates) {
    userLngLat.value = r.geometry.coordinates
  }
}

const popupLngLat = computed<[number, number] | null>(() => {
  return hoveredIdx.value !== null ? rinkLngLat(hoveredIdx.value) : null
})

const popupName = computed<string>(() => {
  return hoveredIdx.value !== null ? rinkName(hoveredIdx.value) : ''
})
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="distance"
        :snippet="TURF_SNIPPET"
        source-path="src/examples/distance/DistancePage.vue"
      >
        <p>
          <code>distance</code> returns the great-circle distance between two
          points in the unit you choose (here, miles).
        </p>
        <p>
          Search an address (top-left of the map) or click anywhere. Each ice
          rink's label updates to show how far it is from your point. Hover a
          pin to see just the rink name.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load rinks: {{ error }}
        </p>
      </CodePanel>
    </template>

    <template #map>
      <DemoMap with-search @click="onMapClick" @search-result="onSearchResult">
        <template v-if="rinks">
          <MapMarker
            v-for="(_, idx) in rinks.features"
            :key="idx"
            :lng-lat="rinkLngLat(idx)"
          >
            <MapIconTextPin
              :icon="faSnowflake"
              :text="labels[idx]"
              color-theme="dark-primary"
              size="large"
              @mouseenter="hoveredIdx = idx"
              @mouseleave="hoveredIdx = null"
            />
          </MapMarker>
        </template>

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
    </template>
  </ExamplePage>
</template>
