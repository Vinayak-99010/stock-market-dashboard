import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import client from 'prom-client'

dotenv.config()
const app = express()
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

const register = new client.Registry()
client.collectDefaultMetrics({ register })
const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000, 2000]
})
register.registerMetric(httpRequestDurationMs)

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const delta = Date.now() - start
    httpRequestDurationMs.labels(req.method, req.path, String(res.statusCode)).observe(delta)
  })
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  try {
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
    const quoteResp = await axios.get(quoteUrl, { timeout: 10000 })
    const q = quoteResp.data?.['Global Quote'] || {}
    const currentPrice = parseFloat(q['05. price'] || '0')

    const intraUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=5min&outputsize=compact&apikey=${apiKey}`
    const intraResp = await axios.get(intraUrl, { timeout: 10000 })
    const series = intraResp.data?.['Time Series (5min)'] || {}

    const history = Object.entries(series)
      .map(([time, values]) => ({ time, price: parseFloat(values['4. close']) }))
      .sort((a, b) => new Date(a.time) - new Date(b.time))

    res.json({ symbol, currentPrice, history })
  } catch (err) {
    console.error(err?.message || err)
    res.status(500).json({ error: 'Failed to fetch from provider' })
  }
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
