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
