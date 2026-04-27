export const TURF_SNIPPET = `import { distance } from '@turf/distance'
import { point } from '@turf/helpers'

// For each ice rink, compute distance in miles from the user's point.
const userPoint = point(searchedLngLat)

const labeledRinks = rinks.features.map((rink) => {
  const miles = distance(userPoint, rink, { units: 'miles' })
  return {
    ...rink,
    label: \`\${rink.properties.AMENITY_NA} — \${miles.toFixed(2)} mi\`,
  }
})
`
