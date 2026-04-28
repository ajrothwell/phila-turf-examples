<script setup lang="ts">
import ExamplePage from './shell/ExamplePage.vue'
import DemoMap from './components/DemoMap.vue'
</script>

<template>
  <ExamplePage>
    <template #code>
      <article class="home-prose">
        <img class="turf-banner" src="/turf.png" alt="Turf.js banner" />
        <img class="turf-banner" src="/turf2.png" alt="Turf.js diagram" />
        <h1>What is this?</h1>
        <p>
          This app is a tour of
          <a href="https://turfjs.org/" target="_blank" rel="noreferrer">
            Turf.js
          </a>. From their homepage:
        </p>
        <blockquote>
          Turf is a JavaScript library for spatial analysis. It includes
          traditional spatial operations, helper functions for creating GeoJSON
          data, and data classification and statistics tools.
        </blockquote>
        <p>
          Most of the code that makes a web map work is rendering, panning,
          zooming, handling clicks, and adding controls and panels like
          legends.
          This app uses
          <a href="https://maplibre.org/" target="_blank" rel="noreferrer">
            MapLibre GL
          </a>
          for that, and most of MapLibre's APIs are already wrapped up inside
          <strong>phila-ui-4's map-core</strong>, so you don't have to know
          much MapLibre to put a working map on a page.
        </p>
        <p>
          Turf functions aren't part of UI components, so they are not part
          of map-core. They are complicated spatial functions using complicated math: distances, buffers, bounding boxes,
          point-in-polygon checks, polygon unions.
          In Esri products (ArcMap, ArcGIS Pro) you get to know and use things from ArcToolbox
          (or whatever that's called now). In Carto or PostGIS, you use
          spatial SQL (<code>ST_DISTANCE</code>, <code>ST_INTERSECTS</code>,
          <code>ST_BUFFER</code>, etc.). This is the same but you just use
          a couple of lines of js.
        </p>
        <p>
          A lot of Turf's functions are also pretty boring — things you have
          to learn because GIS datasets have mistakes (lines that don't quite
          connect, polygon slivers caused by clipping shapes against each
          other, etc.). Routine to use, not exactly exciting.
        </p>
      </article>
    </template>
    <template #map>
      <DemoMap />
    </template>
  </ExamplePage>
</template>

<style scoped>
.home-prose {
  max-width: 640px;
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-default, #0f1419);
}

.home-prose h1 {
  font-size: 1.5rem;
  margin: 4rem 0 1rem;
}

.turf-banner {
  display: block;
  width: 100%;
  max-width: 480px;
  height: auto;
  margin: 0 auto 4rem;
}

.home-prose p {
  margin: 0 0 1rem;
}

.home-prose code {
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace;
  font-size: 0.9em;
  background: rgba(15, 77, 144, 0.08);
  padding: 0.05em 0.4em;
  border-radius: 3px;
}

.home-prose a {
  color: var(--color-brand-primary, #0f4d90);
}

.home-prose blockquote {
  margin: 0 0 1rem;
  padding: 0.6rem 1rem;
  border-left: 3px solid var(--color-brand-primary, #0f4d90);
  background: rgba(15, 77, 144, 0.05);
  font-style: italic;
  color: var(--color-text-secondary, #444);
}
</style>
