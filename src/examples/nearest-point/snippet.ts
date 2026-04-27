export const TURF_SNIPPET = `import { nearestPoint } from '@turf/nearest-point'
import { point, featureCollection } from '@turf/helpers'

// 'markets' is a GeoJSON FeatureCollection of Point features fetched from AGOL.
// 'searchedLngLat' is [lng, lat] of the user's address or click.

const userPoint = point(searchedLngLat)
const nearest = nearestPoint(userPoint, markets)

// nearest.properties.featureIndex — index of the closest market in markets.features
// nearest.properties.distanceToPoint — distance in km
const nearestId = markets.features[nearest.properties.featureIndex].properties.name
`

export const VORONOI_SNIPPET = `import { voronoi } from '@turf/voronoi'
import { bbox } from '@turf/bbox'
import { intersect } from '@turf/intersect'
import { featureCollection } from '@turf/helpers'

// 'markets' is the FeatureCollection of farmers markets.
// 'cityLimits' is a Feature<Polygon> for Philly's city boundary.

// Voronoi takes a points collection plus a bbox.
// Each output polygon contains every location closer to its
// generating market than to any other.
const cells = voronoi(markets, { bbox: bbox(cityLimits) })

// Clip each rectangular cell against the city polygon so
// the diagram stops at the city boundary.
const clipped = cells.features
  .map((cell) => intersect(featureCollection([cell, cityLimits])))
  .filter((c): c is NonNullable<typeof c> => c !== null)
`
