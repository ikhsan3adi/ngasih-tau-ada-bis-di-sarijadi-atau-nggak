import { extractRoute, inferRouteFromPlate } from './routes'
import type { BusData, RawLiveBus, RawTmbBus } from './types'

function cleanPlate(raw: string): string | null {
  const m = raw.toUpperCase().match(/[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}/)
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}

function parseWibEpoch(timeStr: string): number {
  const d = new Date(timeStr.replace(' ', 'T') + '+07:00')
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

interface LiveResponse {
  success: boolean
  data: { result: { error: unknown; data: RawLiveBus[] } }
}

interface TmbResponse {
  status: boolean
  message: { data: RawTmbBus[] }
}

export async function fetchBemoData(): Promise<BusData[] | null> {
  const [liveRes, tmbRes] = await Promise.all([
    fetchJson<LiveResponse>('https://bemo.uptangkutan-bandung.id/map/live'),
    fetchJson<TmbResponse>('https://bemo.uptangkutan-bandung.id/map/tmb/'),
  ])

  if (liveRes === null && tmbRes === null) return null

  const busMap = new Map<string, BusData>()

  const liveBuses = liveRes?.data?.result?.data ?? []
  for (const bus of liveBuses) {
    const { lat, lng } = bus.gps_position
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const rawPlate = (bus.vehicle_no ?? '').split(' - ')[0] ?? ''
    const plate = cleanPlate(rawPlate)
    const key = plate ? `PLATE:${plate}` : `VNO:${bus.vehicle_no}`
    const epoch = parseWibEpoch(bus.gps_position.time)

    busMap.set(key, {
      key,
      plate: plate ?? 'UNKNOWN',
      vehicleNo: bus.vehicle_no,
      routeLabel: extractRoute(bus.vehicle_no) ?? inferRouteFromPlate(plate),
      lat,
      lng,
      updatedAt: epoch,
      source: 'live',
    })
  }

  const tmbBuses = tmbRes?.message?.data ?? []
  for (const bus of tmbBuses) {
    if (bus.is_expired) continue

    const plate = cleanPlate(bus.plate || bus.title || '')
    const lat = parseFloat(bus.latitude)
    const lng = parseFloat(bus.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const key = plate ? `PLATE:${plate}` : `IMEI:${bus.imei}`
    const epoch = parseWibEpoch(bus.time)
    const existing = busMap.get(key)

    if (existing && epoch <= existing.updatedAt) continue

    const routeLabel =
      existing?.routeLabel ??
      extractRoute(bus.title || '') ??
      inferRouteFromPlate(plate)

    busMap.set(key, {
      key,
      plate: plate ?? 'UNKNOWN',
      vehicleNo: bus.title || plate || `TMB-${bus.imei}`,
      routeLabel,
      lat,
      lng,
      updatedAt: epoch,
      source: existing?.source === 'live' ? 'live' : 'tmb',
    })
  }

  return Array.from(busMap.values())
}
