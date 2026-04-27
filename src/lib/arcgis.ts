import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'

/**
 * Fetch features from a Philadelphia AGOL feature service as GeoJSON.
 *
 * `serviceUrl` should point at the layer (e.g. `.../FeatureServer/0`),
 * NOT the service root.
 */
export async function fetchAgolFeatures(serviceUrl: string) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'geojson',
  })
  const url = `${serviceUrl}/query?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`AGOL fetch failed: ${res.status} ${res.statusText} (${url})`)
  }
  const data = (await res.json()) as FeatureCollection<Geometry, GeoJsonProperties>
  return data
}
