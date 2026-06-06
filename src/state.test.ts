import { describe, expect, it } from 'bun:test'
import { StateManager } from './state'
import type { BusData, BusEvaluation, PolygonDef } from './types'

describe('StateManager', () => {
  const polygon: PolygonDef = { name: 'Sarijadi', coords: [] }
  const bus: BusData = {
    key: 'PLATE:D 1234 AB',
    plate: 'D 1234 AB',
    vehicleNo: 'D 1234 AB',
    routeLabel: 'KORIDOR 3',
    lat: 0,
    lng: 0,
    updatedAt: Date.now(),
    source: 'live',
  }

  it('should handle transition states correctly', () => {
    const manager = new StateManager()

    // 1. Absent -> Enter (was absent, now inside)
    let evals: BusEvaluation[] = [{ bus, inside: true, polygon }]
    let events = manager.update(evals)
    expect(events).toHaveLength(1)
    expect(events[0]!.transition).toBe('enter')

    // 2. Inside -> Stay (was inside, now still inside)
    evals = [{ bus, inside: true, polygon }]
    events = manager.update(evals)
    expect(events).toHaveLength(0) // 'stay' transition should not produce events

    // 3. Inside -> Exit (was inside, now outside)
    evals = [{ bus, inside: false, polygon }]
    events = manager.update(evals)
    expect(events).toHaveLength(1)
    expect(events[0]!.transition).toBe('exit')

    // 4. Outside -> Absent (was outside, now still outside)
    evals = [{ bus, inside: false, polygon }]
    events = manager.update(evals)
    expect(events).toHaveLength(0) // 'absent' transition should not produce events
  })

  it('should clear state on daily reset', () => {
    const manager = new StateManager()
    let evals: BusEvaluation[] = [{ bus, inside: true, polygon }]

    manager.update(evals)
    expect(manager.size).toBe(1)

    manager.resetDaily()
    expect(manager.size).toBe(0)
  })
})
