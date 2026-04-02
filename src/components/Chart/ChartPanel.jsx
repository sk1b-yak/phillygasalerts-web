import { useStore } from '../../stores/useStore'
import { usePriceHistory } from '../../hooks/usePriceHistory'
import { useDuckDBWorker } from '../../hooks/useDuckDBWorker'
import { LoadingSpinner } from '../UI/LoadingSpinner'
import { ElectricChart } from './ElectricChart'
import { useEffect, useState } from 'react'

const GAS_TYPE_LABELS = {
  regular: 'Regular',
  midgrade: 'Midgrade',
  premium: 'Premium',
  diesel: 'Diesel',
}

export function ChartPanel() {
  const { records, loading, error } = usePriceHistory()
  const timeRange = useStore(s => s.historyTimeRange)
  const filters = useStore(s => s.historyFilters)
  const theme = useStore(s => s.theme)
  const selectedTimeframe = useStore(s => s.selectedTimeframe)
  const selectedDataSources = useStore(s => s.selectedDataSources)
  const selectedGasType = useStore(s => s.selectedGasType)
  const selectedAggregationLevels = useStore(s => s.selectedAggregationLevels)
  const selectedStations = useStore(s => s.selectedStations)
  const selectedZips = useStore(s => s.selectedZips)

  const setStoreCandleData = useStore(s => s.setCandleData)
  const { isReady, isInitialized, query, initCandles, lastResult } = useDuckDBWorker()
  const [candleData, setCandleData] = useState([])


  // Initialize candles in worker when records are available
  useEffect(() => {
    if (!isReady || records.length === 0) return

    console.log('[ChartPanel] Records received:', records.length, records.slice(0, 2))
    initCandles(records, selectedDataSources)
  }, [isReady, records, initCandles, selectedDataSources])

  // Query worker for filtered data
  useEffect(() => {
    if (!isReady || !isInitialized || records.length === 0) return

    const times = records.map(r => new Date(r.time).getTime())
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    
    const rangeOffsets = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }

    // Parse interval hours from timeframe, default to 24 for 'all'
    const TF_HOURS = { '6h': 6, '24h': 24, '3d': 72, '7d': 168, 'all': 24 }
    const intervalHours = TF_HOURS[selectedTimeframe] || 6
    const BUCKET_INTERVAL = intervalHours * 60 * 60 * 1000
    
    let startTime, endTime
    if (rangeOffsets[timeRange]) {
      endTime = new Date(maxTime + BUCKET_INTERVAL).toISOString()
      startTime = new Date(Math.max(minTime, maxTime - rangeOffsets[timeRange])).toISOString()
    } else {
      startTime = new Date(minTime - BUCKET_INTERVAL).toISOString()
      endTime = new Date(maxTime + BUCKET_INTERVAL).toISOString()
    }

    console.log('[ChartPanel] Query time range:', { timeRange, startTime, endTime, timeframe: selectedTimeframe, recordsCount: records.length })

    // Use new multi-select aggregation state if available, fall back to old filters
    const hasStationSelection = selectedStations.length > 0
    const hasZipSelection = selectedZips.length > 0
    const useStationLevel = selectedAggregationLevels.includes('station')
    const useZipLevel = selectedAggregationLevels.includes('zip')

    if (useStationLevel && hasStationSelection) {
      // Query for selected stations (use first selected for now)
      query('query_station', { stationKey: selectedStations[0], startTime, endTime, timeframe: selectedTimeframe })
    } else if (useZipLevel && hasZipSelection) {
      // Query for selected zips (use first selected for now)
      query('query_zip', { zipCode: selectedZips[0], startTime, endTime, timeframe: selectedTimeframe })
    } else if (filters.station_name) {
      query('query_station', { stationKey: filters.station_name, startTime, endTime, timeframe: selectedTimeframe })
    } else if (filters.zip_code) {
      query('query_zip', { zipCode: filters.zip_code, startTime, endTime, timeframe: selectedTimeframe })
    } else {
      query('query_global', { startTime, endTime, timeframe: selectedTimeframe })
    }
  }, [isReady, isInitialized, records, timeRange, filters, query, selectedTimeframe, selectedAggregationLevels, selectedStations, selectedZips])

  // Process worker results
  useEffect(() => {
    console.log('[ChartPanel] lastResult received:', lastResult)
    if (lastResult?.type === 'result' && lastResult.data) {
      console.log('[ChartPanel] Worker result data length:', lastResult.data.length)
      console.log('[ChartPanel] Worker result sample:', lastResult.data.slice(0, 3))
      
      // Process OHLC candle data for PriceChart
      const chartData = lastResult.data
        .filter(r => r.time && r.open != null && r.high != null && r.low != null && r.close != null)
        .map(r => ({
          time: new Date(r.time).toISOString(),
          open: Number(r.open),
          high: Number(r.high),
          low: Number(r.low),
          close: Number(r.close),
        }))
        .sort((a, b) => new Date(a.time) - new Date(b.time))
      
      console.log('[ChartPanel] Filtered chartData length:', chartData.length)
      console.log('[ChartPanel] Aggregated data sample:', chartData.slice(0, 3))
      setCandleData(chartData)
      setStoreCandleData(chartData)
    }
  }, [lastResult])

  if (loading && records.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-rose-400 mb-2 font-semibold">Failed to load price history</p>
          <p className="text-sm text-white/40">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-hidden p-2" style={{ minHeight: '400px' }}>
        <ElectricChart candleData={candleData} />

      </div>
    </div>
  )
}
