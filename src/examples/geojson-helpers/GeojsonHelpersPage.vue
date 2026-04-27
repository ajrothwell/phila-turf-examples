<script setup lang="ts">
import { computed } from 'vue'
import { point, lineString, polygon } from '@turf/helpers'
import {
  CircleLayer,
  LineLayer,
  FillLayer,
} from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { TURF_SNIPPET } from './snippet'

const cityHall = point([-75.1635, 39.9526], { name: 'City Hall' })
const broadSt = lineString(
  [
    [-75.1635, 39.9526],
    [-75.1623, 39.9583],
    [-75.1611, 39.9636],
    [-75.1597, 39.97],
  ],
  { name: 'N. Broad St' }
)
const oldCity = polygon(
  [
    [
      [-75.1465, 39.9499],
      [-75.141, 39.9499],
      [-75.141, 39.9544],
      [-75.1465, 39.9544],
      [-75.1465, 39.9499],
    ],
  ],
  { name: 'Old City' }
)

const pointSource = computed(() => ({ type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [cityHall] } }))
const lineSource = computed(() => ({ type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [broadSt] } }))
const polySource = computed(() => ({ type: 'geojson' as const, data: { type: 'FeatureCollection' as const, features: [oldCity] } }))

const pretty = (v: unknown) => JSON.stringify(v, null, 2)
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="point / lineString / polygon"
        :snippet="TURF_SNIPPET"
        source-path="src/examples/geojson-helpers/GeojsonHelpersPage.vue"
      >
        <p>
          Turf's helper functions wrap arrays of coordinates into typed GeoJSON
          features. Every other Turf function takes one of these shapes as input.
        </p>
        <p>
          Below: a <strong>point</strong> at City Hall, a
          <strong>lineString</strong> along North Broad, and a
          <strong>polygon</strong> outlining Old City.
        </p>
        <p>
          The values you'd see in the browser console after each call:
        </p>
        <div class="console">
          <div class="console-prompt">&gt; cityHall</div>
          <pre>{{ pretty(cityHall) }}</pre>
        </div>
        <div class="console">
          <div class="console-prompt">&gt; broadSt</div>
          <pre>{{ pretty(broadSt) }}</pre>
        </div>
        <div class="console">
          <div class="console-prompt">&gt; oldCity</div>
          <pre>{{ pretty(oldCity) }}</pre>
        </div>
      </CodePanel>
    </template>
    <template #map>
      <DemoMap :center="[-75.1535, 39.957]" :zoom="13">
        <FillLayer
          id="oldcity-fill"
          :source="polySource"
          :paint="{ 'fill-color': '#0f4d90', 'fill-opacity': 0.25 }"
        />
        <LineLayer
          id="oldcity-outline"
          :source="polySource"
          :paint="{ 'line-color': '#0f4d90', 'line-width': 2 }"
        />
        <LineLayer
          id="broad-st"
          :source="lineSource"
          :paint="{ 'line-color': '#d35400', 'line-width': 4 }"
          :layout="{ 'line-cap': 'round', 'line-join': 'round' }"
        />
        <CircleLayer
          id="cityhall"
          :source="pointSource"
          :paint="{
            'circle-radius': 8,
            'circle-color': '#d35400',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          }"
        />
      </DemoMap>
    </template>
  </ExamplePage>
</template>

<style scoped>
.console {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 0.8rem;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  overflow-x: auto;
  margin-top: 0.5rem;
}

.console-prompt {
  color: #6cb6ff;
  margin-bottom: 0.25rem;
}

.console pre {
  margin: 0;
  white-space: pre;
  font: inherit;
  color: inherit;
}
</style>
