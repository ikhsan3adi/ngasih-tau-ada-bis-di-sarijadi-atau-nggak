import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon } from '@turf/helpers'
import type { BusData, PolygonDef } from './types'

export interface BusEvaluation {
  bus: BusData
  inside: boolean
  polygon: PolygonDef
}

export function evaluateBuses(
  buses: BusData[],
  polygons: PolygonDef[],
): BusEvaluation[] {
  const results: BusEvaluation[] = []

  for (const bus of buses) {
    const pt = point([bus.lng, bus.lat])

    for (const poly of polygons) {
      const pCoords: [number, number][] = poly.coords.map(([lat, lng]) => [
        lng,
        lat,
      ])
      const first = pCoords[0]
      const last = pCoords[pCoords.length - 1]
      if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
        pCoords.push([first[0], first[1]])
      }
      const turfPoly = polygon([pCoords])
      const inside = booleanPointInPolygon(pt, turfPoly)
      results.push({ bus, inside, polygon: poly })
    }
  }

  return results
}
