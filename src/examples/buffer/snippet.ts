export function buildSnippet(miles: number): string {
  return `import { buffer } from '@turf/buffer'

// 'zipcodePolygon' is the GeoJSON Feature<Polygon | MultiPolygon> the
// user clicked or searched for, fetched from Philly AGOL.

const buffered = buffer(zipcodePolygon, ${miles}, { units: 'miles' })

// 'buffered' is a Feature<Polygon> that's the original zipcode
// expanded outward by ${miles} mile${miles === 1 ? '' : 's'}.
`
}
