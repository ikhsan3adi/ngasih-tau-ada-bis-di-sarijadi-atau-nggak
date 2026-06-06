export interface BusData {
  key: string
  plate: string
  vehicleNo: string
  routeLabel: string | null
  lat: number
  lng: number
  updatedAt: number
  source: 'live' | 'tmb'
}

export interface PolygonDef {
  name: string
  coords: [number, number][]
}

export type Transition = 'enter' | 'exit' | 'stay' | 'absent'

export interface RawLiveBus {
  id: number
  vehicle_no: string
  vehicle_code: string
  vehicle_type: string
  gps_position: {
    id: number
    time: string
    lat: number
    lng: number
    course: number
    online: string
    speed: number
    altitude: number
    stop_duration: string
    moved_timestamp: number
    address: string
    tail: { lat: string; lng: string }[]
    sensors: {
      id: number
      type: string
      name: string
      value: string
      val: boolean | number | string
    }[]
  }
}

export interface RawTmbBus {
  imei: string
  id: string
  title: string
  speed: number
  longitude: string
  latitude: string
  server_time: string
  time: string
  alert: number
  acc: number
  plate: string
  veh_type: number
  icon: Record<string, unknown>
  is_expired: boolean
  angle: number
  mileage: number
  battery: string
  satellite: number
  gsm_signal: number
}

export interface StateEvent {
  bus: BusData
  polygon: PolygonDef
  transition: Transition
}

export interface BusEvaluation {
  bus: BusData
  inside: boolean
  polygon: PolygonDef
}
