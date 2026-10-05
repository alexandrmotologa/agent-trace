import http from 'http'

const PORT = 4318
const sseClients = new Set()

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, traceparent, tracestate')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // SSE endpoint for frontend browser clients
  if (req.url === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    res.write('data: {"type": "connected"}\n\n')
    sseClients.add(res)
    console.log(`[OTLP Collector] Client connected to live stream. Total clients: ${sseClients.size}`)

    req.on('close', () => {
      sseClients.delete(res)
      console.log(`[OTLP Collector] Client disconnected. Total clients: ${sseClients.size}`)
    })
    return
  }

  // Status check endpoint
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'running', port: PORT, clients: sseClients.size }))
    return
  }

  // OTLP trace ingestion endpoint (POST /v1/traces)
  if ((req.url === '/v1/traces' || req.url === '/traces') && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        console.log(`[OTLP Collector] Ingested trace payload with ${payload.resourceSpans?.length || 1} resource spans`)

        // Broadcast to all active frontend SSE clients
        const eventData = JSON.stringify({ type: 'trace', payload })
        for (const client of sseClients) {
          client.write(`data: ${eventData}\n\n`)
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'success', received: true }))
      } catch (err) {
        console.error('[OTLP Collector] Failed to parse JSON body:', err.message)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }))
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Endpoint not found. Use POST /v1/traces or GET /events' }))
})

server.listen(PORT, () => {
  console.log(`[OTLP Collector] HTTP server listening on http://localhost:${PORT}`)
  console.log(`[OTLP Collector] Point your agent to: OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:${PORT}"`)
})
