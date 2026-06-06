import * as turf from '@turf/turf'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Activity,
  Bus,
  ChevronRight,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import polygonsDefault from '../../polygons.json'
import {
  PLATE_TO_KORIDOR,
  ROUTE_TO_JURUSAN,
  extractRoute,
} from '../../src/routes'
import polygonsTest from '../../test-polygons.json'

interface BusData {
  key: string
  plate: string
  vehicleNo: string
  routeLabel: string | null
  lat: number
  lng: number
  time: string
  source: 'live' | 'tmb'
  geofence: string | null
}

const PLATE_REGEX = /[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}/

function cleanPlate(raw: string): string | null {
  const m = raw.toUpperCase().match(PLATE_REGEX)
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}

function getRouteColor(routeLabel: string | null): string {
  if (!routeLabel) return '#64748b'
  const label = routeLabel.toUpperCase()
  if (label.includes('KORIDOR 1')) return '#ef4444'
  if (label.includes('KORIDOR 2')) return '#3b82f6'
  if (label.includes('KORIDOR 3')) return '#22c55e'
  if (label.includes('KORIDOR 4')) return '#06b6d4'
  if (label.includes('KORIDOR 5')) return '#f59e0b'
  if (label.includes('FEEDER')) return '#8b5cf6'
  if (label.includes('BS KORIDOR')) return '#eab308'
  if (label.includes('BANDROS')) return '#ec4899'
  return '#64748b'
}

function getInitials(routeLabel: string | null): string {
  if (!routeLabel) return '?'
  const label = routeLabel.toUpperCase()
  if (label.includes('KORIDOR')) {
    const num = label.split(' ').pop()
    return `K${num}`
  }
  if (label.includes('FEEDER')) {
    const num = label.split(' ').pop()
    return `F${num}`
  }
  if (label.includes('BS KORIDOR')) {
    const num = label.split(' ').pop()
    return `BS${num}`
  }
  if (label.includes('BANDROS')) return 'B'
  return '?'
}

export default function App() {
  const [buses, setBuses] = useState<BusData[]>([])
  const [isTestMode, setIsTestMode] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(10)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [apiStatus, setApiStatus] = useState<'online' | 'error' | 'connecting'>(
    'connecting',
  )
  const [selectedBusKey, setSelectedBusKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'geofence'>('all')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const polygonLayersRef = useRef<L.Polygon[]>([])

  const polygonsData: Record<string, number[][]> = isTestMode
    ? polygonsTest
    : polygonsDefault

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const mapInstance = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([-6.904, 107.615], 13)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      },
    ).addTo(mapInstance)

    L.control.zoom({ position: 'topright' }).addTo(mapInstance)
    mapRef.current = mapInstance

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    polygonLayersRef.current.forEach((layer) => map.removeLayer(layer))
    polygonLayersRef.current = []

    const polygons = Object.entries(polygonsData).map(([name, coords]) => {
      const polygonCoords = coords.map((c) => [c[0], c[1]] as [number, number])

      if (
        polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
        polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1]
      ) {
        polygonCoords.push(polygonCoords[0])
      }

      const polygonLayer = L.polygon(polygonCoords, {
        color: '#0ea5e9',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 8',
      }).addTo(map)

      polygonLayer.bindTooltip(name, {
        permanent: true,
        direction: 'center',
        className: 'polygon-tooltip',
      })

      polygonLayersRef.current.push(polygonLayer)
      return polygonLayer
    })

    if (polygons.length > 0) {
      const group = L.featureGroup(polygons)
      map.fitBounds(group.getBounds().pad(0.15), { animate: true, duration: 1 })
    }
  }, [isTestMode])

  const checkGeofence = (lat: number, lng: number): string | null => {
    const point = turf.point([lng, lat])

    for (const [name, coords] of Object.entries(polygonsData)) {
      const turfCoords = coords.map((c) => [c[1], c[0]])
      if (
        turfCoords[0][0] !== turfCoords[turfCoords.length - 1][0] ||
        turfCoords[0][1] !== turfCoords[turfCoords.length - 1][1]
      ) {
        turfCoords.push(turfCoords[0])
      }

      const polygon = turf.polygon([turfCoords])
      if (turf.booleanPointInPolygon(point, polygon)) {
        return name
      }
    }
    return null
  }

  const fetchBusData = async (
    localPath: string,
    fullUrl: string,
  ): Promise<any> => {
    const isLocalDev =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (isLocalDev) {
      try {
        const res = await fetch(localPath)
        if (res.ok) return await res.json()
      } catch (e) {
        console.warn(
          `Local proxy dev failed for ${localPath}, falling back to CORS proxies`,
          e,
        )
      }
    }

    try {
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(fullUrl)}`
      const res = await fetch(corsProxyUrl)
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.warn(
        `corsproxy.io failed for ${fullUrl}, falling back to allorigins`,
        e,
      )
    }

    try {
      const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(fullUrl)}`
      const res = await fetch(allOriginsUrl)
      if (res.ok) {
        const data = await res.json()
        return JSON.parse(data.contents)
      }
    } catch (e) {
      console.error(`All CORS proxies failed to fetch ${fullUrl}`, e)
    }

    return null
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [liveRes, tmbRes] = await Promise.all([
        fetchBusData(
          '/api/live',
          'https://bemo.uptangkutan-bandung.id/map/live',
        ),
        fetchBusData(
          '/api/tmb',
          'https://bemo.uptangkutan-bandung.id/map/tmb/',
        ),
      ])

      if (!liveRes && !tmbRes) {
        setApiStatus('error')
        setIsLoading(false)
        return
      }

      setApiStatus('online')
      const busMap = new Map<string, BusData>()

      const liveBuses = liveRes?.data?.result?.data || []
      liveBuses.forEach((bus: any) => {
        const { lat, lng } = bus.gps_position || {}
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

        const rawPlate = (bus.vehicle_no || '').split(' - ')[0] || ''
        const plate = cleanPlate(rawPlate)
        const key = plate ? `PLATE:${plate}` : `VNO:${bus.vehicle_no}`

        let routeLabel = extractRoute(bus.vehicle_no)
        if (!routeLabel && plate) routeLabel = PLATE_TO_KORIDOR[plate] || null

        busMap.set(key, {
          key,
          plate: plate || 'UNKNOWN',
          vehicleNo: bus.vehicle_no,
          routeLabel,
          lat,
          lng,
          time: bus.gps_position.time,
          source: 'live',
          geofence: checkGeofence(lat, lng),
        })
      })

      const tmbBuses = tmbRes?.message?.data || []
      tmbBuses.forEach((bus: any) => {
        if (bus.is_expired) return

        const plate = cleanPlate(bus.plate || bus.title || '')
        const lat = parseFloat(bus.latitude)
        const lng = parseFloat(bus.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

        const key = plate ? `PLATE:${plate}` : `IMEI:${bus.imei}`

        if (busMap.has(key) && busMap.get(key)!.source === 'live') return

        let routeLabel = extractRoute(bus.title || '')
        if (!routeLabel && plate) routeLabel = PLATE_TO_KORIDOR[plate] || null

        busMap.set(key, {
          key,
          plate: plate || 'UNKNOWN',
          vehicleNo: bus.title || plate || `TMB-${bus.imei}`,
          routeLabel,
          lat,
          lng,
          time: bus.time,
          source: 'tmb',
          geofence: checkGeofence(lat, lng),
        })
      })

      const processedBuses = Array.from(busMap.values())
      setBuses(processedBuses)
    } catch (err) {
      console.error('Error fetching bus data:', err)
      setApiStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isTestMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const currentKeys = new Set(buses.map((b) => b.key))

    Object.keys(markersRef.current).forEach((key) => {
      if (!currentKeys.has(key)) {
        map.removeLayer(markersRef.current[key])
        delete markersRef.current[key]
      }
    })

    buses.forEach((bus) => {
      const color = getRouteColor(bus.routeLabel)
      const initials = getInitials(bus.routeLabel)
      const jurusan = bus.routeLabel
        ? ROUTE_TO_JURUSAN[bus.routeLabel.toUpperCase().trim()] || 'Rute Kota'
        : 'Jurusan Tidak Diketahui'

      const markerHtml = `
        <div class="bus-marker-icon shadow-lg" style="background-color: ${color}; width: 32px; height: 32px;">
          ${initials}
        </div>
      `
      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const popupContent = `
        <div class="min-w-48 text-xs font-sans">
          <div class="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-2">
            <span class="font-bold text-sm tracking-wide text-slate-100">${bus.plate}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-slate-200" style="background: ${color}30; border: 1px solid ${color}60">
              ${bus.source}
            </span>
          </div>
          <div class="space-y-1.5 text-slate-300">
            <div class="flex justify-between"><span class="text-slate-400">Rute:</span><span class="font-medium text-slate-100">${bus.routeLabel || 'Unknown'}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Jurusan:</span><span class="font-medium text-slate-100 text-right max-w-32 truncate">${jurusan}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Gps Time:</span><span class="font-medium text-slate-100">${bus.time || '-'}</span></div>
            ${
              bus.geofence
                ? `
              <div class="mt-2.5 p-1.5 rounded flex items-center gap-1.5 font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                <span>Di dalam ${bus.geofence}</span>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `

      if (markersRef.current[bus.key]) {
        const marker = markersRef.current[bus.key]
        marker.setLatLng([bus.lat, bus.lng])
        marker.setIcon(icon)
        marker.setPopupContent(popupContent)
      } else {
        const marker = L.marker([bus.lat, bus.lng], { icon }).addTo(map)
        marker.bindPopup(popupContent)

        marker.on('popupopen', () => {
          setSelectedBusKey(bus.key)
        })
        marker.on('popupclose', () => {
          setSelectedBusKey(null)
        })

        markersRef.current[bus.key] = marker
      }
    })
  }, [buses])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData()
          return 10
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleBusClick = (bus: BusData) => {
    const map = mapRef.current
    const marker = markersRef.current[bus.key]
    if (map && marker) {
      map.setView([bus.lat, bus.lng], 16, { animate: true, duration: 0.8 })
      marker.openPopup()
      setSelectedBusKey(bus.key)
    }
  }

  const filteredBuses = buses.filter((bus) => {
    if (activeTab === 'geofence' && !bus.geofence) return false

    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    return (
      bus.plate.toLowerCase().includes(query) ||
      (bus.routeLabel || '').toLowerCase().includes(query)
    )
  })

  const busesInGeofence = buses.filter((b) => b.geofence !== null)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <aside className="w-80 md:w-96 flex flex-col bg-slate-900/40 border-r border-slate-800/80 backdrop-blur-xl shrink-0 z-10">
        <header className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
                BEMO Live Tracker
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Realtime
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {apiStatus === 'online' ? (
              <span
                className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20"
                title="API UPTD Online"
              >
                <Wifi className="w-4 h-4" />
              </span>
            ) : (
              <span
                className="p-1.5 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20"
                title="API UPTD Terhambat (Menggunakan Fallback Proxy)"
              >
                <WifiOff className="w-4 h-4" />
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 p-5 border-b border-slate-800/50">
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Bus Aktif
            </span>
            <span className="text-2xl font-extrabold text-slate-100 mt-1">
              {buses.length}
            </span>
            <Activity className="absolute right-3 bottom-3 w-8 h-8 text-slate-800/30 group-hover:text-slate-800/50 transition-colors" />
          </div>

          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Refresh
              </span>
              {isLoading && (
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
              )}
            </div>
            <span className="text-2xl font-extrabold text-slate-100 mt-1">
              {countdown}s
            </span>

            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
              <div
                className="bg-indigo-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-slate-800/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Wilayah Geofence
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <button
              onClick={() => setIsTestMode(false)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                !isTestMode
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Default (Sarijadi)
            </button>
            <button
              onClick={() => setIsTestMode(true)}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                isTestMode
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Test Bandung
            </button>
          </div>
        </div>

        <div className="p-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari plat nomor atau rute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-200"
            />
          </div>
        </div>

        <div className="px-5 flex border-b border-slate-800/40 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('geofence')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'geofence'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Di Geofence
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                busesInGeofence.length > 0
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {busesInGeofence.length}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
          {filteredBuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
              <Info className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
              <p className="text-xs">Tidak ada bus yang sesuai kriteria.</p>
            </div>
          ) : (
            filteredBuses.map((bus) => {
              const color = getRouteColor(bus.routeLabel)
              const isSelected = selectedBusKey === bus.key
              const initials = getInitials(bus.routeLabel)

              return (
                <div
                  key={bus.key}
                  onClick={() => handleBusClick(bus)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-slate-800/70 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-950/20 border-slate-800/60 hover:bg-slate-900/30 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-100 shadow-sm shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-200">
                        {bus.plate}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {bus.routeLabel || 'Unknown Route'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bus.geofence ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
                        {bus.geofence}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-medium tracking-wide bg-slate-900 text-slate-500 border border-slate-800/50">
                        Luar Geofence
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <footer className="p-4 bg-slate-950/40 border-t border-slate-800/50 text-[10px] text-slate-500 flex justify-between">
          <span>
            Total: {filteredBuses.length} dari {buses.length} bus
          </span>
          <span className="font-mono">UPTD Angkutan BDG</span>
        </footer>
      </aside>

      <main className="flex-1 relative h-full">
        <div ref={mapContainerRef} className="w-full h-full"></div>

        <div className="absolute top-4 left-4 z-[999] bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-xl flex items-center gap-2 shadow-2xl pointer-events-none">
          <MapPin className="w-4 h-4 text-sky-400" />
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
            {isTestMode
              ? 'Mode: Bandung Raya (Test)'
              : 'Mode: Sarijadi (Default)'}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-[999] bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide text-slate-200 shadow-2xl pointer-events-none">
          &copy; {new Date().getFullYear()} ikhsan3adi
        </div>
      </main>
    </div>
  )
}
