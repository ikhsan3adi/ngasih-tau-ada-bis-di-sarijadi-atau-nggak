export function startHealthServer(log: (msg: string) => void): void {
  if (process.argv.includes('-1')) return

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
  Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/health' || url.pathname === '/') {
        return new Response('OK', { status: 200 })
      }
      return new Response('Not Found', { status: 404 })
    },
  })
  log(`[System] HTTP server listening on port ${port}`)
}
