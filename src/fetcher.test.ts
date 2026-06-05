import { describe, expect, it, mock, beforeAll, afterAll } from 'bun:test'
import { fetchBemoData } from './fetcher'

describe('Fetcher & Deduplication', () => {
  let originalFetch: typeof fetch

  beforeAll(() => {
    originalFetch = globalThis.fetch
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('should deduplicate buses correctly and infer route from plate if missing', async () => {
    // Mock successful fetch responses
    globalThis.fetch = mock((url: string) => {
      if (url.includes('/map/live')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                result: {
                  error: null,
                  data: [
                    {
                      id: 1,
                      vehicle_no: 'D 7899 AS - KORIDOR 2',
                      vehicle_code: 'TMB-1',
                      vehicle_type: 'Bus',
                      gps_position: {
                        lat: -6.88,
                        lng: 107.57,
                        time: '2026-06-05 12:00:00',
                      },
                    },
                  ],
                },
              },
            }),
          ),
        )
      } else if (url.includes('/map/tmb/')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: true,
              message: {
                data: [
                  {
                    imei: '123456',
                    id: '123456',
                    title: 'D 7899 AS',
                    plate: 'D 7899 AS',
                    latitude: '-6.89',
                    longitude: '107.58',
                    time: '2026-06-05 12:05:00', // Newer timestamp
                    is_expired: false,
                  },
                  {
                    imei: '987654',
                    id: '987654',
                    title: 'D 7906 AS', // Inferred as KORIDOR 4
                    plate: 'D 7906 AS',
                    latitude: '-6.90',
                    longitude: '107.65',
                    time: '2026-06-05 12:00:00',
                    is_expired: false,
                  },
                ],
              },
            }),
          ),
        )
      }
      return Promise.reject(new Error('Unknown URL'))
    }) as any

    const buses = await fetchBemoData()
    expect(buses).not.toBeNull()
    const list = buses!
    expect(list).toHaveLength(2)

    // D 7899 AS should be updated with TMB data (newer time)
    const bus1 = list.find((b) => b.plate === 'D 7899 AS')
    expect(bus1).toBeDefined()
    expect(bus1!.lat).toBe(-6.89)
    expect(bus1!.lng).toBe(107.58)
    expect(bus1!.routeLabel).toBe('KORIDOR 2') // Inferred from map.js/fetcher.ts mapping

    // D 7906 AS should be inferred as KORIDOR 4
    const bus2 = list.find((b) => b.plate === 'D 7906 AS')
    expect(bus2).toBeDefined()
    expect(bus2!.routeLabel).toBe('KORIDOR 4')
  })

  it('should return null if both fetches fail', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('Network Error')),
    ) as any

    const buses = await fetchBemoData()
    expect(buses).toBeNull()
  })
})
