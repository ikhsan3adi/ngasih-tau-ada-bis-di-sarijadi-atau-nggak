import type { BusEvaluation, StateEvent, Transition } from './types'

export class StateManager {
  private state = new Map<string, boolean>()

  update(evaluations: BusEvaluation[]): StateEvent[] {
    const events: StateEvent[] = []

    for (const ev of evaluations) {
      const storageKey = `${ev.bus.key}:${ev.polygon.name}`
      const wasInside = this.state.get(storageKey) ?? false
      const nowInside = ev.inside

      const transition: Transition =
        !wasInside && nowInside
          ? 'enter'
          : wasInside && !nowInside
            ? 'exit'
            : wasInside && nowInside
              ? 'stay'
              : 'absent'

      this.state.set(storageKey, nowInside)

      if (transition === 'enter' || transition === 'exit') {
        events.push({ bus: ev.bus, polygon: ev.polygon, transition })
      }
    }

    return events
  }

  resetDaily(): void {
    this.state.clear()
  }

  get size(): number {
    return this.state.size
  }
}
