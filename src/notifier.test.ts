import { describe, expect, it } from 'bun:test'
import { formatPolygonConsolidatedMessage } from './notifier'
import type { StateEvent } from './state'

describe('Notifier Templates', () => {
  it('should format polygon consolidated summary messages correctly', () => {
    const mockEvents: StateEvent[] = [
      {
        bus: {
          key: 'PLATE:D 7899 AS',
          plate: 'D 7899 AS',
          vehicleNo: 'D 7899 AS',
          routeLabel: 'KORIDOR 2',
          lat: 0,
          lng: 0,
          updatedAt: 0,
          source: 'live',
        },
        polygon: { name: 'Bandung', coords: [] },
        transition: 'enter',
      },
      {
        bus: {
          key: 'PLATE:D 7906 AS',
          plate: 'D 7906 AS',
          vehicleNo: 'D 7906 AS',
          routeLabel: 'KORIDOR 4',
          lat: 0,
          lng: 0,
          updatedAt: 0,
          source: 'live',
        },
        polygon: { name: 'Bandung', coords: [] },
        transition: 'enter',
      },
      {
        bus: {
          key: 'PLATE:D 7901 AS',
          plate: 'D 7901 AS',
          vehicleNo: 'D 7901 AS',
          routeLabel: 'KORIDOR 3',
          lat: 0,
          lng: 0,
          updatedAt: 0,
          source: 'live',
        },
        polygon: { name: 'Bandung', coords: [] },
        transition: 'exit',
      },
    ]

    const mockDate = new Date('2026-06-05T12:00:00Z')
    const summary = formatPolygonConsolidatedMessage(
      'Bandung',
      mockEvents,
      mockDate,
    )
    expect(summary).toContain('🚌 <b>[INFO BIS]</b>')
    expect(summary).toContain('Waktu: <code>2026/6/5 19:00:00 WIB</code>')
    expect(summary).toContain('Transisi Wilayah: <code>Bandung</code>')
    expect(summary).toContain(
      '↙️ <b>Memasuki Wilayah <code>Bandung</code>:</b>',
    )
    expect(summary).toContain(
      '🟢 KORIDOR 2 | Cicaheum - Cibeureum\n       <code>D 7899 AS</code>',
    )
    expect(summary).toContain(
      '🟢 KORIDOR 4 | Antapani - Leuwipanjang\n       <code>D 7906 AS</code>',
    )
    expect(summary).toContain(
      '↗️ <b>Meninggalkan Wilayah <code>Bandung</code>:</b>',
    )
    expect(summary).toContain(
      '🔴 KORIDOR 3 | Cicaheum - Sarijadi\n       <code>D 7901 AS</code>',
    )
  })
})
