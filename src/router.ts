import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/examples/geojson-helpers',
  },
  {
    path: '/examples/geojson-helpers',
    name: 'geojson-helpers',
    component: () => import('./examples/geojson-helpers/GeojsonHelpersPage.vue'),
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
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
