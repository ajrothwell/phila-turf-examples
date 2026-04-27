import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./HomePage.vue'),
  },
  {
    path: '/examples/geojson-helpers',
    name: 'geojson-helpers',
    component: () => import('./examples/geojson-helpers/GeojsonHelpersPage.vue'),
  },
  {
    path: '/examples/feature-collection',
    name: 'feature-collection',
    component: () => import('./examples/feature-collection/FeatureCollectionPage.vue'),
  },
  {
    path: '/examples/bbox',
    name: 'bbox',
    component: () => import('./examples/bbox/BboxPage.vue'),
  },
  {
    path: '/examples/nearest-point',
    name: 'nearest-point',
    component: () => import('./examples/nearest-point/NearestPointPage.vue'),
  },
  {
    path: '/examples/distance',
    name: 'distance',
    component: () => import('./examples/distance/DistancePage.vue'),
  },
  {
    path: '/examples/buffer',
    name: 'buffer',
    component: () => import('./examples/buffer/BufferPage.vue'),
  },
  {
    path: '/examples/points-within-polygon',
    name: 'points-within-polygon',
    component: () => import('./examples/points-within-polygon/PointsWithinPolygonPage.vue'),
  },
  {
    path: '/examples/centroid',
    name: 'centroid',
    component: () => import('./examples/centroid/CentroidPage.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
