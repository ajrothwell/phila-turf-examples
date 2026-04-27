# phila-turf-examples

A small Vue 3 + TypeScript demo showing how to use [Turf.js](https://turfjs.org/) with the [`@phila/phila-ui-map-core`](https://www.npmjs.com/package/@phila/phila-ui-map-core) map component, against real Philadelphia ArcGIS data.

Live: <https://ajrothwell.github.io/phila-turf-examples/>

## Examples

1. **point / lineString / polygon** — Turf's GeoJSON helpers. Static City Hall + Broad St + Old City demo, with each call's `console.log`-style output shown next to it.
2. **nearestPoint** — Search a Philly address (or click the map) to find the nearest farmers market. Map auto-zooms to fit the address and the nearest market. Bonus toggle overlays a Voronoi diagram of the markets clipped to the city limits.
3. **distance** — Search an address (or click the map) and watch ice rink pins update with their distance to your point. Click a pin to see its name.

Each example uses real data from Philadelphia's public ArcGIS Online org and the city's basemap tiles.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints.

## Build

```bash
pnpm build
pnpm preview
```

## Deploy

Pushes to `main` are deployed automatically by `.github/workflows/deploy.yml` to GitHub Pages. The site lives at the URL above.

To set up Pages on a fresh fork:

1. Go to the repo's **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main`; the workflow builds with pnpm and publishes `dist/`

The Vite `base` is set to `/phila-turf-examples/` and the router uses hash history so deep links work without server rewrites.

## Stack

- Vue 3, TypeScript, Vite, Vue Router 4
- `@phila/phila-ui-core`, `@phila/phila-ui-app-header`, `@phila/phila-ui-map-core`
- `@turf/helpers`, `@turf/nearest-point`, `@turf/distance`, `@turf/voronoi`, `@turf/bbox`, `@turf/intersect`
- `shiki` for syntax highlighting in the example code panels
