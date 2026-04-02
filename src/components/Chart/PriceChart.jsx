import { useEffect, useRef } from 'react'
import { createChart, ColorType, CandlestickSeries, LineSeries, LineStyle } from 'lightweight-charts'
import { useStore } from '../../stores/useStore'

const COLORS = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
}

const PRICELINE_COLOR = '#006BB6'
const PRICELINE_COLOR_DARK = '#4A9FD8'

// Data source colors for line series
const SOURCE_COLORS = {
  zyla: '#006BB6',      // Philadelphia blue
  google: '#22c55e',    // Green
}

export function PriceChart({ width, height, candleData, sourceData, chartType = 'candle' }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const lineSeriesRef = useRef(null)
  const priceLineRef = useRef(null)
  const sourceSeriesRef = useRef({})
  const prevDataRef = useRef([])

  const theme = useStore(s => s.theme)
  const selectedDataSources = useStore(s => s.selectedDataSources)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    // Get dimensions with fallback values to prevent zero-size charts
    const containerWidth = chartContainerRef.current.clientWidth
    const containerHeight = chartContainerRef.current.clientHeight
    const chartWidth = width || containerWidth || 800
    const chartHeight = height || containerHeight || 400

    console.log('[PriceChart] Container dimensions:', { containerWidth, containerHeight, chartWidth, chartHeight })

    const chart = createChart(chartContainerRef.current, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1e293b' : '#f8fafc' },
        textColor: isDark ? '#e2e8f0' : '#1e293b',
      },
      grid: {
        vertLines: { color: isDark ? '#334155' : '#e2e8f0' },
        horzLines: { color: isDark ? '#334155' : '#e2e8f0' },
      },
      timeScale: {
        borderColor: isDark ? '#475569' : '#cbd5e1',
        timeVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000)
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#475569' : '#cbd5e1',
      },
      crosshair: {
        mode: 1,
      },
    })

    chartRef.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.upColor,
      downColor: COLORS.downColor,
      borderUpColor: COLORS.borderUpColor,
      borderDownColor: COLORS.borderDownColor,
      wickUpColor: COLORS.wickUpColor,
      wickDownColor: COLORS.wickDownColor,
      visible: true,
    })
    candleSeriesRef.current = candleSeries

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#006BB6',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      visible: false,
    })
    lineSeriesRef.current = lineSeries

    return () => {
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      lineSeriesRef.current = null
      priceLineRef.current = null
    }
  }, [theme])

  // Switch between candle and line based on chartType prop
  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current) return
    const isLine = chartType === 'line'
    candleSeriesRef.current.applyOptions({ visible: !isLine })
    lineSeriesRef.current.applyOptions({ visible: isLine })
  }, [chartType])

  useEffect(() => {
    if (!candleSeriesRef.current || !candleData.length) return

    const chartData = candleData
      .filter(r => r.time && r.open != null && r.high != null && r.low != null && r.close != null)
      .map(r => ({
        time: new Date(r.time).getTime() / 1000,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
      }))
      .sort((a, b) => a.time - b.time)

    const prevData = prevDataRef.current
    const isInitialLoad = prevData.length === 0
    const hasNewData = chartData.length > prevData.length
    const lastCandleChanged = !isInitialLoad && chartData.length > 0 && prevData.length > 0 &&
      chartData[chartData.length - 1].close !== prevData[prevData.length - 1].close

    if (isInitialLoad) {
      candleSeriesRef.current.setData(chartData)
    } else if (hasNewData) {
      const newCandles = chartData.slice(prevData.length)
      newCandles.forEach(candle => {
        candleSeriesRef.current.update(candle)
      })
    } else if (lastCandleChanged) {
      candleSeriesRef.current.update(chartData[chartData.length - 1])
    }

    prevDataRef.current = chartData

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const priceLineColor = isDark ? PRICELINE_COLOR_DARK : PRICELINE_COLOR

    const lastCandle = chartData[chartData.length - 1]
    const currentPrice = lastCandle?.close

    if (currentPrice != null) {
      if (priceLineRef.current) {
        priceLineRef.current.applyOptions({
          price: currentPrice,
          title: `$${currentPrice.toFixed(3)}`,
          color: priceLineColor,
        })
      } else {
        priceLineRef.current = candleSeriesRef.current.createPriceLine({
          price: currentPrice,
          color: priceLineColor,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `$${currentPrice.toFixed(3)}`,
        })
      }
    }

    if (isInitialLoad) {
      chartRef.current.timeScale().fitContent()
    }

    // Keep line series in sync using close price
    if (lineSeriesRef.current && chartData.length > 0) {
      const lineData = chartData.map(r => ({ time: r.time, value: r.close }))
      lineSeriesRef.current.setData(lineData)
    }
  }, [candleData, theme])

  useEffect(() => {
    if (!chartRef.current || !sourceData || Object.keys(sourceData).length === 0) return

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    Object.entries(sourceData).forEach(([source, data]) => {
      if (!data || data.length === 0) return

      const color = SOURCE_COLORS[source] || '#888888'
      
      if (!sourceSeriesRef.current[source]) {
        const lineSeries = chartRef.current.addSeries(LineSeries, {
          color: color,
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
        })
        sourceSeriesRef.current[source] = lineSeries
      }

      const lineData = data
        .filter(r => r.time && r.close != null)
        .map(r => ({
          time: new Date(r.time).getTime() / 1000,
          value: Number(r.close),
        }))
        .sort((a, b) => a.time - b.time)

      sourceSeriesRef.current[source].setData(lineData)
    })

    return () => {
      Object.values(sourceSeriesRef.current).forEach(series => {
        chartRef.current.removeSeries(series)
      })
      sourceSeriesRef.current = {}
    }
  }, [sourceData, theme, selectedDataSources])

  useEffect(() => {
    if (!chartRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0) {
          chartRef.current.applyOptions({ width: w, height: h })
        }
      }
    })
    observer.observe(chartContainerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full"
      style={{
        minWidth: width || '100%',
        minHeight: height || '300px',
      }}
    />
  )
}
