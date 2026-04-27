<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
// #region turf-import
import { point } from '@turf/helpers'
import { distance } from '@turf/distance'
// #endregion turf-import
import { faSnowflake } from '@fortawesome/free-solid-svg-icons'
import type { Feature, FeatureCollection, Point } from 'geojson'
import {
  CircleLayer,
  MapMarker,
  MapIconTextPin,
  MapPopup,
  MapSearchControl,
} from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './DistancePage.vue?raw'

const RINKS_SERVICE_URL =
  'https://services.arcgis.com/6fiE7QkLWSPMd0N5/arcgis/rest/services/IceRinks/FeatureServer/0'
const NAME_FIELD = 'AMENITY_NA'

const rinks = ref<FeatureCollection<Point> | null>(null)
const userLngLat = ref<[number, number] | null>(null)
const selectedIndex = ref<number | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    rinks.value = (await fetchAgolFeatures(RINKS_SERVICE_URL)) as FeatureCollection<Point>
  } catch (e) {
    error.value = (e as Error).message
  }
})

const rinkName = (index: number): string => {
  return String(rinks.value?.features[index]?.properties?.[NAME_FIELD] ?? `Rink ${index + 1}`)
}

const rinkLngLat = (index: number): [number, number] => {
  const c = rinks.value!.features[index].geometry.coordinates
  return [c[0], c[1]]
}

// #region turf-usage
const distanceLabels = computed<(string | undefined)[]>(() => {
  if (!rinks.value || !userLngLat.value) return []
  return rinks.value.features.map((rink) => {
    const miles = distance(point(userLngLat.value!), rink as Feature<Point>, { units: 'miles' })
    return `${miles.toFixed(2)} mi`
  })
})
// #endregion turf-usage

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
  return selectedIndex.value !== null ? rinkLngLat(selectedIndex.value) : null
})

const popupName = computed<string>(() => {
  return selectedIndex.value !== null ? rinkName(selectedIndex.value) : ''
})

const scriptSnippetHtml = ref('')
const templateSnippetHtml = ref('')

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
        title="distance"
        source-path="src/examples/distance/DistancePage.vue"
      >
        <p>
          <code>distance</code> returns the great-circle distance between two
          points in the unit you choose (here, miles).
        </p>
        <p>
          Search an address (top-left of the map) or click anywhere. Each ice
          rink's pin shows its distance from your point. Click a pin to see
          its name in a popup.
        </p>
        <p v-if="error" style="color: var(--color-text-error, #b21d10);">
          Couldn't load rinks: {{ error }}
        </p>
        <div class="snippet" v-html="scriptSnippetHtml" />
        <p class="snippet-label">And in the template:</p>
        <div class="snippet" v-html="templateSnippetHtml" />
      </CodePanel>
    </template>

    <template #map>
      <DemoMap :zoom="9.7" @click="onMapClick">
        <MapSearchControl
          position="top-left"
          placeholder="Search a Philly address"
          :center-on-result="false"
          @result="onSearchResult"
        />
        <template v-if="rinks">
          <MapMarker
            v-for="(_, index) in rinks.features"
            :key="index"
            :lng-lat="rinkLngLat(index)"
          >
            <div @click.stop>
              <!-- #region turf-template -->
              <MapIconTextPin
                :icon="faSnowflake"
                :text="distanceLabels[index]"
                color-theme="dark-primary"
                size="large"
                @click="selectedIndex = index"
              />
              <!-- #endregion turf-template -->
            </div>
          </MapMarker>
        </template>

        <MapPopup
          v-if="popupLngLat"
          :lng-lat="popupLngLat"
          :close-on-click="false"
          @close="selectedIndex = null"
        >
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
</style>
