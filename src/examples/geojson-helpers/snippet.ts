export const TURF_SNIPPET = `import { point, lineString, polygon } from '@turf/helpers'

// A point — City Hall
const cityHall = point([-75.1635, 39.9526], { name: 'City Hall' })

// A lineString — a stretch of N. Broad St
const broadSt = lineString(
  [
    [-75.1635, 39.9526],
    [-75.1623, 39.9583],
    [-75.1611, 39.9636],
    [-75.1597, 39.9700],
  ],
  { name: 'N. Broad St' }
)

// A polygon — a small loop in Old City
const oldCity = polygon(
  [
    [
      [-75.1465, 39.9499],
      [-75.1410, 39.9499],
      [-75.1410, 39.9544],
      [-75.1465, 39.9544],
      [-75.1465, 39.9499],
    ],
  ],
  { name: 'Old City' }
)
`
