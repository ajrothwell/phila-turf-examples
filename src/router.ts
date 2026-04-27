import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('./shell/Placeholder.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
