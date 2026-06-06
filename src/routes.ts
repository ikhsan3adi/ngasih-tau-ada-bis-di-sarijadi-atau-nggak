export const PLATE_TO_KORIDOR: Record<string, string> = {
  'D 7504 AP': 'KORIDOR 1',
  'D 7505 AP': 'KORIDOR 1',
  'D 7509 AP': 'KORIDOR 1',
  'D 7510 AP': 'KORIDOR 1',
  'D 7525 AP': 'KORIDOR 1',
  'D 7993 AO': 'KORIDOR 1',
  'D 7994 AO': 'KORIDOR 1',
  'D 7995 AO': 'KORIDOR 1',

  'D 7521 AP': 'KORIDOR 2',
  'D 7896 AS': 'KORIDOR 2',
  'D 7898 AS': 'KORIDOR 2',
  'D 7899 AS': 'KORIDOR 2',
  'D 7909 AS': 'KORIDOR 2',
  'D 7910 AS': 'KORIDOR 2',
  'D 7996 AO': 'KORIDOR 2',

  'D 7661 AP': 'KORIDOR 3',
  'D 7895 AS': 'KORIDOR 3',
  'D 7901 AS': 'KORIDOR 3',
  'D 7903 AS': 'KORIDOR 3',
  'D 7908 AS': 'KORIDOR 3',
  'D 7912 AS': 'KORIDOR 3',

  'D 7904 AS': 'KORIDOR 4',
  'D 7906 AS': 'KORIDOR 4',
  'D 7907 AS': 'KORIDOR 4',

  'D 7905 AS': 'KORIDOR 5',

  'D 7694 AQ': 'FEEDER 1',
  'D 7720 AQ': 'FEEDER 1',

  'D 7696 AQ': 'FEEDER 2',
  'D 7703 AQ': 'FEEDER 2',

  'D 7611 AO': 'BS KORIDOR 1',
  'D 7616 AO': 'BS KORIDOR 2',
  'D 7881 AO': 'BS KORIDOR 3',
  'D 7852 AO': 'BS KORIDOR 4',

  'D 7882 AQ': 'BANDROS MERAH',
  'D 7877 AQ': 'BANDROS MERAH',
  'D 7883 AQ': 'BANDROS KUNING',
  'D 7876 AQ': 'BANDROS HIJAU TUA',
  'D 7891 AQ': 'BANDROS TOSCA',
  'D 7879 AQ': 'BANDROS BIRU',
  'D 7886 AQ': 'BANDROS UNGU MUDA',
  'D 7889 AQ': 'BANDROS UNGU TUA',
  'D 7885 AQ': 'BANDROS PINK PASTEL',
  'D 7890 AQ': 'BANDROS ABU',
  'D 7881 AQ': 'BANDROS HITAM',
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

  BANDROS: 'Bandung Tour on Bus',
  'BANDROS MERAH': 'Bandung Tour on Bus',
  'BANDROS BIRU': 'Bandung Tour on Bus',
  'BANDROS KUNING': 'Bandung Tour on Bus',
  'BANDROS HIJAU TUA': 'Bandung Tour on Bus',
  'BANDROS UNGU TUA': 'Bandung Tour on Bus',
  'BANDROS UNGU MUDA': 'Bandung Tour on Bus',
  'BANDROS PINK PASTEL': 'Bandung Tour on Bus',
  'BANDROS TOSCA': 'Bandung Tour on Bus',
  'BANDROS HITAM': 'Bandung Tour on Bus',
  'BANDROS ABU': 'Bandung Tour on Bus',
}

export function extractRoute(vehicleNo: string): string | null {
  const m = vehicleNo
    .toUpperCase()
    .match(
      /(KORIDOR \d|FEEDER \d|BS KORIDOR \d|BANDROS(?:\s+[A-Z]+){1,2}|BANDROS|BOSEH)/,
    )
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
