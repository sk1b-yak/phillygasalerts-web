import { useEffect, useState, useRef } from 'react'
import { useStore } from '../../stores/useStore'

export function PeriodStats() {
  const candleData = useStore(s => s.getCandleData())
  const historyRecords = useStore(s => s.historyRecords)
  const historyTimeRange = useStore(s => s.historyTimeRange)
  const lastUpdated = useStore(s => s.lastUpdated)

  const [lowAnim, setLowAnim] = useState(null)
  const [highAnim, setHighAnim] = useState(null)
  const prevLowRef = useRef(null)
  const prevHighRef = useRef(null)

  let periodLow = null
  let periodHigh = null

  if (candleData && candleData.length > 0) {
    const prices = candleData.map(c => c.low || c.open || c.close).filter(p => p != null && !isNaN(p))
    const highPrices = candleData.map(c => c.high || c.open || c.close).filter(p => p != null && !isNaN(p))
    if (prices.length > 0) periodLow = Math.min(...prices)
    if (highPrices.length > 0) periodHigh = Math.max(...highPrices)
  } else if (historyRecords && historyRecords.length > 0) {
    // Fallback: compute from raw records when DuckDB candles not yet ready
    const prices = historyRecords.map(r => parseFloat(r.price_regular || r.price || 0)).filter(p => p > 0)
    if (prices.length > 0) {
      periodLow = Math.min(...prices)
      periodHigh = Math.max(...prices)
    }
  }

  useEffect(() => {
    if (lastUpdated === null) {
      prevLowRef.current = periodLow
      prevHighRef.current = periodHigh
      return
    }
    if (prevLowRef.current !== null && periodLow !== null) {
      if (periodLow < prevLowRef.current) {
        setLowAnim('down')
      } else if (periodLow > prevLowRef.current) {
        setLowAnim('up')
      }
    }
    if (prevHighRef.current !== null && periodHigh !== null) {
      if (periodHigh < prevHighRef.current) {
        setHighAnim('down')
      } else if (periodHigh > prevHighRef.current) {
        setHighAnim('up')
      }
    }
    const timer = setTimeout(() => {
      setLowAnim(null)
      setHighAnim(null)
    }, 500)
    prevLowRef.current = periodLow
    prevHighRef.current = periodHigh
    return () => clearTimeout(timer)
  }, [lastUpdated, periodLow, periodHigh])

  const getTimeframeLabel = () => {
    const labels = {
      '2h': '2H',
      '4h': '4H',
      '6h': '6H',
      '12h': '12H',
      '24h': '24H',
      '7d': '7D',
      '30d': '30D',
      '90d': '90D',
      'all': 'All',
    }
    return labels[historyTimeRange] || historyTimeRange.toUpperCase()
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    return price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  }

  const getPriceClass = (animType) => {
    const baseClass = "text-5xl font-mono font-black tracking-tighter transition-all duration-500"
    switch (animType) {
      case 'up':
        return `${baseClass} text-rose-500 animate-flash-rose`
      case 'down':
        return `${baseClass} text-emerald-500 animate-flash-emerald`
      default:
        return `${baseClass} text-white/90 group-hover:text-white/70`
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.03] transition-all cursor-default">
        <div className="text-[10px] text-white/30 font-black tracking-[0.4em] mb-6 uppercase pl-1">
          PERIOD LOW ({getTimeframeLabel()})
        </div>
        <div className={getPriceClass(lowAnim)}>
          ${formatPrice(periodLow)}
        </div>
      </div>

      <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.03] transition-all cursor-default">
        <div className="text-[10px] text-white/30 font-black tracking-[0.4em] mb-6 uppercase pl-1">
          PERIOD HIGH ({getTimeframeLabel()})
        </div>
        <div className={getPriceClass(highAnim)}>
          ${formatPrice(periodHigh)}
        </div>
      </div>
    </div>
  )
}

export default PeriodStats
