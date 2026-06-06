import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PLATE_TO_KORIDOR, ROUTE_TO_JURUSAN } from '../routes'

const PORT = 3000
const HTML_PATH = join(__dirname, 'index.html')
const POLYGONS_PATH = join(__dirname, '../../polygons.json')
const TEST_POLYGONS_PATH = join(__dirname, '../../test-polygons.json')

const BEMO_LIVE_URL = 'https://bemo.uptangkutan-bandung.id/map/live'
const BEMO_TMB_URL = 'https://bemo.uptangkutan-bandung.id/map/tmb/'

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
    clearTimeout(id)
    return response
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Serve HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        const html = readFileSync(HTML_PATH, 'utf-8')
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      } catch (e) {
        return new Response(
          'Gagal memuat index.html. Pastikan file berada di folder src/visualizer/',
          { status: 500 },
        )
      }
    }

    // Proxy API Live
    if (url.pathname === '/api/live') {
      try {
        const response = await fetchWithTimeout(BEMO_LIVE_URL)
        const data = await response.json()
        return Response.json(data, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e.message || 'Error fetching live data' }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      }
    }

    // Proxy API TMB
    if (url.pathname === '/api/tmb') {
      try {
        const response = await fetchWithTimeout(BEMO_TMB_URL)
        const data = await response.json()
        return Response.json(data, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        })
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e.message || 'Error fetching TMB data' }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      }
    }

    // Get Polygons Data
    if (url.pathname === '/api/polygons') {
      const isTest = url.searchParams.get('test') === 'true'
      const path = isTest ? TEST_POLYGONS_PATH : POLYGONS_PATH
      try {
        if (existsSync(path)) {
          const content = JSON.parse(readFileSync(path, 'utf-8'))
          return Response.json(content, {
            headers: { 'Access-Control-Allow-Origin': '*' },
          })
        }
        return new Response(
          JSON.stringify({ error: 'File polygon tidak ditemukan' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        )
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    }

    // Serve routes and lookup mapping (from src/routes.ts)
    if (url.pathname === '/api/routes') {
      return Response.json(
        {
          plateToKoridor: PLATE_TO_KORIDOR,
          routeToJurusan: ROUTE_TO_JURUSAN,
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`[Visualizer] Server berjalan di http://localhost:${PORT}`)
