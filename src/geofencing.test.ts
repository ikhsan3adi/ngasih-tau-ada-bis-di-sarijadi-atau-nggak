import { describe, expect, it } from 'bun:test'
import { evaluateBuses } from './geofencing'
import type { BusData, PolygonDef } from './types'

describe('Geofencing', () => {
  const mockPolygons: PolygonDef[] = [
    {
      name: 'Sarijadi (Open)',
      coords: [
        [-6.881213, 107.575714],
        [-6.879661, 107.581227],
        [-6.882398, 107.582088],
        [-6.892019, 107.582061],
        [-6.891758, 107.5809],
        [-6.883133, 107.58112],
        [-6.883024, 107.579682],
        [-6.881999, 107.578566],
        [-6.882662, 107.576272],
      ],
    },
  ]

  const busInside: BusData = {
    key: 'PLATE:D 1234 AB',
    plate: 'D 1234 AB',
    vehicleNo: 'D 1234 AB - KORIDOR 3',
    routeLabel: 'KORIDOR 3',
    lat: -6.881, // Inside Sarijadi area
    lng: 107.579,
    updatedAt: Date.now(),
    source: 'live',
  }

  const busOutside: BusData = {
    key: 'PLATE:D 5678 CD',
    plate: 'D 5678 CD',
    vehicleNo: 'D 5678 CD - KORIDOR 2',
    routeLabel: 'KORIDOR 2',
    lat: -6.9, // Far away
    lng: 107.6,
    updatedAt: Date.now(),
    source: 'live',
  }

  it('should evaluate a bus inside the polygon correctly and NOT crash on unclosed coordinates', () => {
    const results = evaluateBuses([busInside], mockPolygons)
    expect(results).toHaveLength(1)
    expect(results[0]!.inside).toBe(true)
    expect(results[0]!.polygon.name).toBe('Sarijadi (Open)')
  })

  it('should evaluate a bus outside the polygon correctly', () => {
    const results = evaluateBuses([busOutside], mockPolygons)
    expect(results).toHaveLength(1)
    expect(results[0]!.inside).toBe(false)
  })
})
