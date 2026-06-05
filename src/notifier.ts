import { config } from './config'
import { enrichRoute } from './routes'
import type { StateEvent } from './state'

const TELEGRAM_API = 'https://api.telegram.org/bot'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function formatPolygonConsolidatedMessage(
  polygonName: string,
  events: StateEvent[],
  date: Date,
): string {
  const enters: string[] = []
  const exits: string[] = []

  for (const ev of events) {
    const plate = ev.bus.plate
    const enriched = enrichRoute(ev.bus.routeLabel)
    const route = ` ${escapeHtml(enriched)}\n       `

    if (ev.transition === 'enter') {
      const line = `🟢${route}<code>${escapeHtml(plate)}</code>`
      enters.push(line)
    } else if (ev.transition === 'exit') {
      const line = `🔴${route}<code>${escapeHtml(plate)}</code>`
      exits.push(line)
    }
  }

  const wibTime = date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
  })

  const lines = [
    `🚌 <b>[INFO BIS]</b>`,
    `Waktu: <code>${wibTime} WIB</code>`,
    `Transisi Wilayah: <code>${escapeHtml(polygonName)}</code>\n`,
  ]

  if (enters.length > 0) {
    lines.push(
      `↙️ <b>Memasuki Wilayah <code>${escapeHtml(polygonName)}</code>:</b>`,
    )
    lines.push(...enters)
  }

  if (exits.length > 0) {
    lines.push(
      `\n↗️ <b>Meninggalkan Wilayah <code>${escapeHtml(polygonName)}</code>:</b>`,
    )
    lines.push(...exits)
  }

  return lines.join('\n')
}

export function formatDownMessage(error: string): string {
  return `⚠️ API BEMO down atau network error: ${escapeHtml(error)}`
}

export function formatUpMessage(): string {
  return '✅ Sistem BEMO sudah kembali online!'
}

export async function sendTelegram(text: string): Promise<boolean> {
  const token = config.telegramBotToken
  const chatId = config.telegramChatId
  if (!token || !chatId) {
    console.warn('[notifier] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set')
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.warn(`[notifier] Telegram API error ${res.status}: ${body}`)
      return false
    }
    return true
  } catch (err) {
    console.warn('[notifier] Network error sending to Telegram:', err)
    return false
  }
}
