import { config, isWibSleepTime, loadPolygons } from './config'
import { fetchBemoData } from './fetcher'
import { evaluateBuses } from './geofencing'
import {
  formatDownMessage,
  formatPolygonConsolidatedMessage,
  formatUpMessage,
  sendTelegram,
} from './notifier'
import { StateManager } from './state'
import type { PolygonDef } from './types'

const state = new StateManager()
let isServerDown = false
let lastResetDay = new Date().getDate()

function log(msg: string): void {
  const wibTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
  })
  console.log(`[${wibTime} WIB] ${msg}`)
}

async function tick(): Promise<void> {
  const now = new Date()

  if (now.getDate() !== lastResetDay) {
    log('[State] Pergantian hari terdeteksi. Mereset state map harian.')
    state.resetDaily()
    lastResetDay = now.getDate()
  }

  if (isWibSleepTime(now)) {
    log(
      `[Scheduler] Memasuki waktu tidur WIB (19:00 - 05:00). Loop akan tidur selama ${
        config.sleepIntervalSec / 60
      } menit.`,
    )
    await Bun.sleep(config.sleepIntervalSec * 1000)
    return
  }

  const buses = await fetchBemoData()
  if (buses === null) {
    log(
      '[Fetcher] ERROR: Gagal mengambil data dari API BEMO (API down atau network error).',
    )
    if (!isServerDown) {
      isServerDown = true
      await sendTelegram(formatDownMessage('API BEMO down atau network error'))
    }
    return
  }

  if (isServerDown) {
    log('[Fetcher] API BEMO kembali online.')
    isServerDown = false
    await sendTelegram(formatUpMessage())
  }

  log(`[Fetcher] Polling selesai. Bus aktif terdeteksi: ${buses.length}`)

  if (buses.length === 0) {
    return
  }

  const polyDefs: PolygonDef[] = Object.entries(loadPolygons()).map(
    ([name, coords]) => ({ name, coords: coords as [number, number][] }),
  )
  const evaluations = evaluateBuses(buses, polyDefs)
  const events = state.update(evaluations)

  if (events.length === 0) {
    return
  }

  const eventsByPolygon: Record<string, typeof events> = {}
  for (const ev of events) {
    const polyName = ev.polygon.name
    if (!eventsByPolygon[polyName]) {
      eventsByPolygon[polyName] = []
    }
    eventsByPolygon[polyName].push(ev)
  }

  for (const [polyName, polyEvents] of Object.entries(eventsByPolygon)) {
    log(
      `[Telegram] Mengirim notifikasi konsolidasi wilayah ${polyName} (${polyEvents.length} transisi bus).`,
    )
    const text = formatPolygonConsolidatedMessage(polyName, polyEvents, now)
    await sendTelegram(text)
  }
}

process.on('SIGTERM', () => {
  log('[System] Menerima SIGTERM. Menghentikan bot...')
  process.exit(0)
})

log('[System] Memulai BEMO Geofencing & Tracker Bot...')

while (true) {
  const start = Date.now()
  await tick()
  const elapsed = (Date.now() - start) / 1000
  const wait = Math.max(0, config.pollIntervalSec - elapsed)

  // get args '-1' then exit immediately
  if (process.argv.includes('-1')) {
    log("[System] Argumen '-1' terdeteksi, bot akan langsung keluar.")
    process.exit(0)
  }

  await Bun.sleep(wait * 1000)
}
