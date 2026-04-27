<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
// #region turf-import
import { point, lineString, polygon, featureCollection } from '@turf/helpers'
import { bbox } from '@turf/bbox'
import { bboxPolygon } from '@turf/bbox-polygon'
// #endregion turf-import
import {
  CircleLayer,
  LineLayer,
  FillLayer,
} from '@phila/phila-ui-map-core'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { highlight } from '../../lib/highlight'
import { extractRegions } from '../../lib/extractRegions'
import pageSource from './FeatureCollectionPage.vue?raw'

const cityHall = point([-75.1635, 39.9526], { name: 'City Hall' })
const broadSt = lineString(
  [
    [-75.1635, 39.9526],
    [-75.1623, 39.9583],
    [-75.1611, 39.9636],
    [-75.1597, 39.97],
  ],
  { name: 'N. Broad St' },
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
  { name: 'Old City' },
)

// #region turf-usage
const everything = featureCollection([cityHall, broadSt, oldCity])
const everythingBbox = bbox(everything)
const bboxAsPolygon = bboxPolygon(everythingBbox)
// #endregion turf-usage

const everythingSource = computed(() => ({
  type: 'geojson' as const,
  data: everything,
}))

const bboxAsPolygonSource = computed(() => ({
  type: 'geojson' as const,
  data: bboxAsPolygon,
}))

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

const pretty = (v: unknown) => JSON.stringify(v, null, 2)
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="featureCollection"
        source-path="src/examples/feature-collection/FeatureCollectionPage.vue"
      >
        <p>
          <code>featureCollection</code> wraps an array of features into a single
          GeoJSON FeatureCollection. Most other Turf functions take a
          FeatureCollection as input, and a single source on the map can render
          all the features at once.
        </p>
        <p>
          Below: the same point, lineString, and polygon from the previous
          lesson, wrapped into one collection. With them bundled, one
          <code>bbox()</code> call returns the bounding box of all three, and
          <code>bboxPolygon()</code> turns that tuple into a renderable
          rectangle (drawn dashed on the map).
        </p>

        <div class="snippet" v-html="scriptSnippetHtml" />
        <p class="snippet-label">And in the template:</p>
        <div class="snippet" v-html="templateSnippetHtml" />

        <div class="block">
          <div class="console-prompt">&gt; everything</div>
          <pre class="console">{{ pretty(everything) }}</pre>
        </div>

        <div class="block">
          <div class="console-prompt">&gt; everythingBbox</div>
          <pre class="console">{{ pretty(everythingBbox) }}</pre>
        </div>
      </CodePanel>
    </template>
    <template #map>
      <DemoMap :center="[-75.1535, 39.957]" :zoom="13">
        <!-- #region turf-template -->
        <LineLayer
          id="bbox-outline"
          :source="bboxAsPolygonSource"
          :paint="{
            'line-color': '#555',
            'line-width': 1.5,
            'line-dasharray': [3, 3],
          }"
        />
        <!-- #endregion turf-template -->
        <FillLayer
          id="oldcity-fill"
          :source="everythingSource"
          :filter="['==', ['geometry-type'], 'Polygon']"
          :paint="{ 'fill-color': '#0f4d90', 'fill-opacity': 0.25 }"
        />
        <LineLayer
          id="oldcity-outline"
          :source="everythingSource"
          :filter="['==', ['geometry-type'], 'Polygon']"
          :paint="{ 'line-color': '#0f4d90', 'line-width': 2 }"
        />
        <LineLayer
          id="broad-st"
          :source="everythingSource"
          :filter="['==', ['geometry-type'], 'LineString']"
          :paint="{ 'line-color': '#d35400', 'line-width': 4 }"
          :layout="{ 'line-cap': 'round', 'line-join': 'round' }"
        />
        <CircleLayer
          id="cityhall"
          :source="everythingSource"
          :filter="['==', ['geometry-type'], 'Point']"
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
.block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid var(--color-border-default, #d4d8d9);
}

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

.console {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 0.8rem;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  overflow-x: auto;
  margin: 0;
}

.console-prompt {
  color: #6cb6ff;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 0.8rem;
}
</style>
