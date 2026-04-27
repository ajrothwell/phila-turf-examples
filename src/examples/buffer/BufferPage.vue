<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
import { fetchAgolFeatures } from '../../lib/arcgis'

const ZIPCODES_SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Zipcodes_Poly/FeatureServer/0'
const ZIP_FIELD = 'code'

type ZipFeature = Feature<Polygon | MultiPolygon, { zipcode: string }>

const zipFeatures = ref<ZipFeature[]>([])
const error = ref<string | null>(null)

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
      </CodePanel>
    </template>

    <template #map>
      <DemoMap />
    </template>
  </ExamplePage>
</template>
