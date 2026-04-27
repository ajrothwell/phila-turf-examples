<script setup lang="ts">
import ExamplePage from './shell/ExamplePage.vue'
import DemoMap from './components/DemoMap.vue'
</script>

<template>
  <ExamplePage>
    <template #code>
      <article class="home-prose">
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
          Web maps need a lot of specialized code to work, but most of that is
          UI plumbing. This app uses
          <a href="https://maplibre.org/" target="_blank" rel="noreferrer">
            MapLibre GL
          </a>
          under the hood, and most of MapLibre's APIs are already wrapped up
          inside <strong>phila-ui-4's map-core</strong> — meaning you don't
          have to know that much MapLibre to put a working map on a page.
        </p>
        <p>
          Turf is different. Turf functions aren't UI components — they're GIS
          math: distances, buffers, bounding boxes, point-in-polygon checks,
          polygon unions. Think of it as ArcToolbox, but in JavaScript: a
          toolbox of complicated math-and-geography functions you can call in
          a couple of lines.
        </p>
        <p>
          Many of these operations also exist in spatial SQL
          (<code>ST_DISTANCE</code>, <code>ST_INTERSECTS</code>,
          <code>ST_BUFFER</code>, etc.). If you've used Carto or PostGIS or
          any other spatial database, Turf is the JavaScript equivalent — same
          operations, different runtime.
        </p>
        <p>
          Pick a lesson on the left to see real examples. Each page shows the
          actual code from the running app, extracted from the source file so
          what you read is what's running.
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
  margin: 0 0 1rem;
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
