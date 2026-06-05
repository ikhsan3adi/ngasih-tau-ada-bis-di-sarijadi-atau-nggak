export const PLATE_TO_KORIDOR: Record<string, string> = {
  'D 7994 AO': 'KORIDOR 1',
  'D 7910 AS': 'KORIDOR 2',
  'D 7509 AP': 'KORIDOR 1',
  'D 7898 AS': 'KORIDOR 2',
  'D 7901 AS': 'KORIDOR 3',
  'D 7694 AQ': 'FEEDER 1',
  'D 7995 AO': 'KORIDOR 1',
  'D 7905 AS': 'KORIDOR 5',
  'D 7903 AS': 'KORIDOR 3',
  'D 7720 AQ': 'FEEDER 1',
  'D 7504 AP': 'KORIDOR 1',
  'D 7906 AS': 'KORIDOR 4',
  'D 7899 AS': 'KORIDOR 2',
  'D 7907 AS': 'KORIDOR 4',
  'D 7912 AS': 'KORIDOR 3',
  'D 7909 AS': 'KORIDOR 2',
  'D 7904 AS': 'KORIDOR 4',
  'D 7896 AS': 'KORIDOR 2',
  'D 7895 AS': 'KORIDOR 3',
  'D 7510 AP': 'KORIDOR 1',
}

export const ROUTE_TO_JURUSAN: Record<string, string> = {
  'KORIDOR 1': 'Cibiru - Cibeureum',
  'KORIDOR 2': 'Cicaheum - Cibeureum',
  'KORIDOR 3': 'Cicaheum - Sarijadi',
  'KORIDOR 4': 'Antapani - Leuwipanjang',
  'KORIDOR 5': 'Antapani - Stasiun Hall',
  'FEEDER 1': 'Stasiun Hall - Gunung Batu',
  'FEEDER 2': 'Summarecon Mall - Cibeureum',
  'BS KORIDOR 1': 'Antapani - Ledeng',
  'BS KORIDOR 2': 'Leuwipanjang - Dago',
  'BS KORIDOR 3': 'Cibiru - Alun Alun',
  'BS KORIDOR 4': 'Cibiru - Cibeureum',
}

export function extractRoute(vehicleNo: string): string | null {
  const m = vehicleNo
    .toUpperCase()
    .match(/(KORIDOR \d|FEEDER \d|BS KORIDOR \d|BANDROS|BOSEH)/)
  return m ? m[1]! : null
}

export function inferRouteFromPlate(plate: string | null): string | null {
  if (!plate) return null
  return PLATE_TO_KORIDOR[plate] ?? null
}

export function enrichRoute(routeLabel: string | null): string {
  if (!routeLabel) return 'Unknown Route'
  const upper = routeLabel.toUpperCase().trim()
  const jurusan = ROUTE_TO_JURUSAN[upper]
  return jurusan ? `${routeLabel} | ${jurusan}` : routeLabel
}
