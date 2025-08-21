import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, CategoryScale } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, CategoryScale)

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default function App() {
  const [ticker, setTicker] = useState('RELIANCE.NS')
  const [price, setPrice] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (t) => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(t)}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setPrice(data.currentPrice)
      setHistory(data.history || [])
    } catch (e) {
      setError(e.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(ticker)
    const id = setInterval(() => fetchData(ticker), 60000)
    return () => clearInterval(id)
  }, [])

  const chartData = {
    labels: history.map(p => p.time),
    datasets: [{
      label: `${ticker} Price`,
      data: history.map(p => p.price),
      fill: false
    }]
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 960, margin: '0 auto' }}>
      <h1>📈 Stock Market Dashboard (NSE)</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          placeholder="e.g., TCS.NS, HDFCBANK.NS, RELIANCE.NS"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={() => fetchData(ticker)} style={{ padding: '8px 12px' }}>Fetch</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
        <h2>Current Price: {price !== null ? `₹ ${price}` : '—'}</h2>
        <small>(Updated every 60s)</small>
      </div>

      <div style={{ marginTop: 24 }}>
        <Line data={chartData} />
      </div>

      <p style={{ marginTop: 24, color: '#555' }}>
        Tip: Try tickers like <b>TCS.NS</b>, <b>INFY.NS</b>, <b>HDFCBANK.NS</b>, <b>ITC.NS</b>
      </p>
    </div>
  )
}
