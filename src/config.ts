import { readFileSync } from 'fs'
import { join } from 'path'

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  pollIntervalSec: process.env.POLL_INTERVAL_SEC
    ? parseInt(process.env.POLL_INTERVAL_SEC, 10)
    : 60,
  sleepStartHour: process.env.SLEEP_START_HOUR
    ? parseInt(process.env.SLEEP_START_HOUR, 10)
    : 19,
  sleepEndHour: process.env.SLEEP_END_HOUR
    ? parseInt(process.env.SLEEP_END_HOUR, 10)
    : 5,
  sleepIntervalSec: process.env.SLEEP_INTERVAL_SEC
    ? parseInt(process.env.SLEEP_INTERVAL_SEC, 10)
    : 3600,
}

export function loadPolygons(): Record<string, [number, number][]> {
  let path = 'polygons.json'

  if (process.argv.includes('-bdg')) {
    path = 'test-polygons.json'
  }

  const p = join(import.meta.dir, '..', path)
  return JSON.parse(readFileSync(p, 'utf-8'))
}

export function isWibSleepTime(now: Date): boolean {
  if (process.env.BYPASS_SLEEP_MODE === 'true') return false

  const h = now.getUTCHours() + 7
  const hour = h >= 24 ? h - 24 : h

  const start = config.sleepStartHour
  const end = config.sleepEndHour

  if (start === end) {
    return false
  }

  if (start < end) {
    return hour >= start && hour < end
  } else {
    return hour >= start || hour < end
  }
}
