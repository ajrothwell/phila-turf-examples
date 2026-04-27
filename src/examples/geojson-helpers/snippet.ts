export const IMPORT_SNIPPET = `import { point, lineString, polygon } from '@turf/helpers'`

export const POINT_SNIPPET = `const cityHall = point([-75.1635, 39.9526], { name: 'City Hall' })`

export const LINE_SNIPPET = `const broadSt = lineString(
  [
    [-75.1635, 39.9526],
    [-75.1623, 39.9583],
    [-75.1611, 39.9636],
    [-75.1597, 39.9700],
  ],
  { name: 'N. Broad St' }
)`

export const POLYGON_SNIPPET = `const oldCity = polygon(
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
)`
