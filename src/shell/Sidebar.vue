<script setup lang="ts">
import { RouterLink } from 'vue-router'

const items = [
  { to: '/', label: 'Intro' },
  { to: '/examples/geojson-helpers', label: 'point / line / polygon' },
  { to: '/examples/feature-collection', label: 'featureCollection' },
  { to: '/examples/bbox', label: 'bbox' },
  { to: '/examples/nearest-point', label: 'nearestPoint' },
  { to: '/examples/distance', label: 'distance' },
  { to: '/examples/buffer', label: 'buffer' },
  { to: '/examples/points-within-polygon', label: 'pointsWithinPolygon' },
  { to: '/examples/area-perimeter', label: 'area / perimeter' },
  { to: '/examples/centroid', label: 'centroid / centerOfMass' },
  { to: '/examples/nearest-point-on-line', label: 'nearestPointOnLine' },
]
</script>

<template>
  <nav class="sidebar">
    <ul>
      <li v-for="item in items" :key="item.to">
        <RouterLink :to="item.to" active-class="active">
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-default, #d4d8d9);
  background: var(--color-surface-elevated, #f4f6f7);
  overflow-y: auto;
}

.sidebar ul {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.sidebar li a {
  display: block;
  padding: 0.6rem 1rem;
  color: var(--color-text-default, #0f1419);
  font-size: 0.9rem;
  border-left: 3px solid transparent;
}

.sidebar li a.active {
  background: var(--color-surface-default, #ffffff);
  border-left-color: var(--color-brand-primary, #0f4d90);
  font-weight: 600;
}

.sidebar li a:hover {
  text-decoration: none;
  background: var(--color-surface-default, #ffffff);
}
</style>
