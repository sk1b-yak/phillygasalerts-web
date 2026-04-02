import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  sma,
  ema,
  minMaxBand,
  stdDevBands,
  percentiles as computePercentiles,
  trendLine,
  aggregateDaily,
  aggregateWeekly,
} from '../utils/computations.js'

export const useStore = create(
  persist(
    (set, get) => ({
      // Stations data
      stations: [],
      setStations: (stations) => set({ stations }),

      // Filters
      sortOrder: 'asc',
      setSortOrder: (order) => set({ sortOrder: order }),
      toggleSortOrder: () => set((state) => ({
        sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc'
      })),

      selectedZip: null,
      setSelectedZip: (zip) => set({ selectedZip: zip }),
      clearZipFilter: () => set({ selectedZip: null }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // UI State
      show3D: false,
      toggle3D: () => set((state) => ({ show3D: !state.show3D })),

      // Layer visualization mode: 'heatmap' | 'scatter' | '3d'
      layerMode: 'scatter',
      setLayerMode: (mode) => set({ layerMode: mode, show3D: mode === '3d' }),

      selectedStation: null,
      setSelectedStation: (station) => set({ selectedStation: station }),

      // Directions / navigation mode
      directionsRoute: null,
      directionsOrigin: null,
      directionsLoading: false,
      directionsError: null,
      setDirectionsRoute: (route, origin) => set({
        directionsRoute: route,
        directionsOrigin: origin,
        directionsLoading: false,
        directionsError: null,
      }),
      setDirectionsLoading: (v) => set({ directionsLoading: v }),
      setDirectionsError: (msg) => set({ directionsError: msg, directionsLoading: false }),
      clearDirections: () => set({
        directionsRoute: null,
        directionsOrigin: null,
        directionsLoading: false,
        directionsError: null,
      }),

      // Desktop side panel
      panelOpen: true,
      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

      // Mobile bottom sheet: 'peek' | 'half' | 'full'
      bottomSheetPosition: 'peek',
      setBottomSheetPosition: (pos) => set({ bottomSheetPosition: pos }),

      // Color scheme override (non-persisted)
      schemeOverride: null,
      setSchemeOverride: (name) => set({ schemeOverride: name }),

      // Theme
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      toggleTheme: () => {
        const current = get().theme
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
        set({ theme: next })
        applyTheme(next)
      },

      // Map view state
      viewState: {
        longitude: -75.1652,
        latitude: 39.9526,
        zoom: 11,
        pitch: 0,
        bearing: 0,
      },
      setViewState: (vs) => set((state) => ({ viewState: { ...state.viewState, ...vs } })),
      flyToStation: (station) => set({
        viewState: {
          longitude: station.lng || station.longitude,
          latitude: station.lat || station.latitude,
          zoom: 14,
          pitch: 0,
          bearing: 0,
        }
      }),

      // Loading states
      isLoading: true,
      setIsLoading: (loading) => set({ isLoading: loading }),

      error: null,
      setError: (error) => set({ error }),

      // Recent filter
      showOnlyRecent: false,
      recentThresholdMinutes: 60,
      toggleRecentFilter: () => set((state) => ({
        showOnlyRecent: !state.showOnlyRecent
      })),
      setRecentThreshold: (minutes) => set({
        recentThresholdMinutes: minutes
      }),

      // Stats
      stats: null,
      setStats: (stats) => set({ stats }),

      // --- History slice ---
      historyRecords: [],
      historyLoading: false,
      historyError: null,
      historyFilters: { zip_code: null, station_name: null, aggregation_level: 'station' },
      historyTimeRange: 'all',
      historyAggregation: 'raw',
      selectedTimeframe: '6h',

      // Chart aggregation state
      aggregationLevel: 'global', // 'station' | 'zip' | 'global'
      historySelectedStation: null, // station_key or null
      historySelectedZip: null, // zip_code or null
      priceHistory3Line: [], // array of {time, min_price, avg_price, max_price}

      // Multi-select aggregation levels (new)
      selectedAggregationLevels: ['station'], // array of 'station' | 'zip' | 'global'
      selectedStations: [], // array of station names for specific filtering
      selectedZips: [], // array of zip codes for specific filtering

      // View mode for unified filter bar
      viewMode: 'auto', // 'auto' | 'chart'
      chartType: 'candle', // 'candle' | 'line'
      chartType: 'candle', // 'candle' | 'line'

      // Gas type filter
      selectedGasType: 'regular', // 'regular' | 'midgrade' | 'premium' | 'diesel'

      enabledComputations: {
        sma7: true,
        sma30: true,
        ema12: true,
        minMaxBand: true,
        volatilityBands: false,
        percentiles: false,
        trendLine: false,
      },

      selectedDataSources: ['zyla', 'google', 'gasbuddy', 'waze', 'other'],
      setSelectedDataSources: (sources) => set({ selectedDataSources: sources }),
      toggleDataSource: (source) => set((state) => {
        const current = state.selectedDataSources
        const isSelected = current.includes(source)
        return {
          selectedDataSources: isSelected
            ? current.filter(s => s !== source)
            : [...current, source]
        }
      }),
      clearDataSourceFilter: () => set({ selectedDataSources: [] }),

      // History actions
      setHistoryRecords: (records) => set({ historyRecords: records, historyLoading: false, historyError: null }),
      setHistoryLoading: (loading) => set({ historyLoading: loading }),
      setHistoryError: (error) => set({ historyError: error, historyLoading: false }),
      setHistoryFilters: (filters) => set((state) => ({ historyFilters: { ...state.historyFilters, ...filters } })),
      setHistoryTimeRange: (range) => set({ historyTimeRange: range }),
      setHistoryAggregation: (agg) => set({ historyAggregation: agg }),
      setTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),
      setGasType: (gasType) => set({ selectedGasType: gasType }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setChartType: (type) => set({ chartType: type }),
      setChartType: (type) => set({ chartType: type }),
      toggleComputation: (key) => set((state) => ({
        enabledComputations: { ...state.enabledComputations, [key]: !state.enabledComputations[key] }
      })),

      // Multi-select aggregation actions
      setAggregationLevel: (level) => set({ selectedAggregationLevels: [level] }),
      toggleAggregationLevel: (level) => set((state) => {
        const current = state.selectedAggregationLevels
        const isSelected = current.includes(level)
        if (isSelected) {
          return { selectedAggregationLevels: current.filter(l => l !== level) }
        } else {
          return { selectedAggregationLevels: [...current, level] }
        }
      }),
      setSelectedStations: (stations) => set({ selectedStations: stations }),
      toggleSelectedStation: (station) => set((state) => {
        const current = state.selectedStations
        const isSelected = current.includes(station)
        if (isSelected) {
          return { selectedStations: current.filter(s => s !== station) }
        } else {
          return { selectedStations: [...current, station] }
        }
      }),
      setSelectedZips: (zips) => set({ selectedZips: zips }),
      toggleSelectedZip: (zip) => set((state) => {
        const current = state.selectedZips
        const isSelected = current.includes(zip)
        if (isSelected) {
          return { selectedZips: current.filter(z => z !== zip) }
        } else {
          return { selectedZips: [...current, zip] }
        }
      }),

      getFilteredHistory: function() {
        const { historyRecords, historyFilters, selectedStations, selectedZips, selectedAggregationLevels } = get()
        let filtered = historyRecords

        if (historyFilters.zip_code) {
          filtered = filtered.filter(r => r.zip_code === historyFilters.zip_code)
        }
        if (historyFilters.station_name) {
          filtered = filtered.filter(r =>
            r.station_name && r.station_name.toLowerCase().includes(historyFilters.station_name.toLowerCase())
          )
        }

        if (selectedAggregationLevels.includes('station') && selectedStations.length > 0) {
          filtered = filtered.filter(r => selectedStations.includes(r.station_name))
        }
        if (selectedAggregationLevels.includes('zip') && selectedZips.length > 0) {
          filtered = filtered.filter(r => selectedZips.includes(r.zip_code))
        }

        return filtered
      },

      getRangedHistory: function() {
        const filtered = get().getFilteredHistory()
        const { historyTimeRange } = get()
        if (historyTimeRange === 'all') return filtered

        const rangeMs = {
          '2h': 2 * 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '12h': 12 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000,
        }[historyTimeRange]

        if (!rangeMs) return filtered

        const cutoff = Date.now() - rangeMs
        return filtered.filter(r => {
          const t = typeof r.time === 'string' ? new Date(r.time).getTime() : r.time
          return t >= cutoff
        })
      },

      // Computed: aggregated history (daily/weekly/raw)
      getAggregatedHistory: function() {
        const ranged = get().getRangedHistory()
        const { historyAggregation } = get()

        if (historyAggregation === 'daily') return aggregateDaily(ranged)
        if (historyAggregation === 'weekly') return aggregateWeekly(ranged)
        return ranged
      },

      // Computed: derived series from enabled computations
      getComputedSeries: function() {
        const base = get().getAggregatedHistory()
        const { enabledComputations } = get()
        const result = { base }

        if (enabledComputations.sma7) {
          result.sma7 = sma(base, 7)
        }
        if (enabledComputations.sma30) {
          result.sma30 = sma(base, 30)
        }
        if (enabledComputations.ema12) {
          result.ema12 = ema(base, 12)
        }
        if (enabledComputations.minMaxBand) {
          result.minMax = minMaxBand(base)
        }
        if (enabledComputations.volatilityBands) {
          result.volatility = stdDevBands(base, 20, 2)
        }
        if (enabledComputations.percentiles) {
          result.percentiles = computePercentiles(base, [25, 50, 75])
        }
        if (enabledComputations.trendLine) {
          result.trend = trendLine(base)
        }

        return result
      },

      // Computed: filtered and sorted stations
      getFilteredStations: () => {
        const {
          stations,
          sortOrder,
          selectedZip,
          searchQuery,
          selectedGasType,
          selectedDataSources,
          showOnlyRecent,
          recentThresholdMinutes
        } = get()

        let filtered = [...stations]

        // Filter by ZIP code
        if (selectedZip) {
          filtered = filtered.filter(s => s.zip_code === selectedZip)
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(s =>
            s.station_name.toLowerCase().includes(query) ||
            s.zip_code.includes(query) ||
            s.address.toLowerCase().includes(query)
          )
        }

        // Filter by gas type - only show stations with valid price for selected type
        if (selectedGasType) {
          filtered = filtered.filter(s => {
            const priceKey = `price_${selectedGasType}`
            const price = s[priceKey]
            return price != null && parseFloat(price) > 0
          })
        }

        // Filter by data source
        if (selectedDataSources && selectedDataSources.length > 0) {
          filtered = filtered.filter(s => {
            const source = (s.source || 'other').toLowerCase()
            // Normalize source names to match filter keys
            const normalizedSource = source === 'google places' ? 'google' : source
            return selectedDataSources.includes(normalizedSource)
          })
        }

        // Filter by recency
        if (showOnlyRecent && recentThresholdMinutes) {
          const cutoff = Date.now() - (recentThresholdMinutes * 60 * 1000)
          filtered = filtered.filter(s => {
            const time = s.price_updated_at || s.time
            if (!time) return false
            const t = typeof time === 'string' ? new Date(time).getTime() : time
            return t >= cutoff
          })
        }

        // Sort by price (using selected gas type price)
        filtered.sort((a, b) => {
          const priceKey = selectedGasType ? `price_${selectedGasType}` : 'price_regular'
          const priceA = parseFloat(a[priceKey] || a.price_regular || 0)
          const priceB = parseFloat(b[priceKey] || b.price_regular || 0)
          return sortOrder === 'asc' ? priceA - priceB : priceB - priceA
        })

        return filtered
      },

      // Computed: price range
      getPriceRange: () => {
        const stations = get().stations
        if (stations.length === 0) return { min: 0, max: 0, avg: 0 }

        const prices = stations.map(s => parseFloat(s.price_regular))
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length

        return { min, max, avg }
      },

      // Candle data state for OHLC charts
      candleData: [],
      setCandleData: (data) => set({ candleData: data }),

      // Current price for priceline
      currentPrice: null,
      setCurrentPrice: (price) => set({ currentPrice: price }),

      isLive: true,
      lastUpdated: null,
      toggleLive: () => set((state) => ({ isLive: !state.isLive })),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
      refreshData: async () => {
        const { setIsLoading, setError, setStations, setStats } = get()
        try {
          const api = await import('../services/api.js')
          const [pricesData, statsData] = await Promise.all([
            api.fetchPrices(),
            api.fetchStats()
          ])
          const stationsArray = Array.isArray(pricesData)
            ? pricesData
            : pricesData.data || pricesData.stations || []
          setStations(stationsArray)
          setStats(statsData)
          set({ lastUpdated: new Date().toISOString() })
        } catch (error) {
          setError(error.message || 'Failed to refresh data')
        }
      },

      getCandleData: function() {
        const { candleData, historyTimeRange } = get()

        if (historyTimeRange === 'all') return candleData

        const rangeMs = {
          '2h': 2 * 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '12h': 12 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000,
        }[historyTimeRange]

        if (!rangeMs) return candleData

        const cutoff = Date.now() - rangeMs
        return candleData.filter(r => {
          const t = typeof r.time === 'string' ? new Date(r.time).getTime() : r.time
          return t >= cutoff
        })
      },

      getCurrentPrice: function() {
        const { candleData } = get()
        if (!candleData || candleData.length === 0) return null

        const sorted = [...candleData].sort((a, b) => {
          const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time
          const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time
          return timeA - timeB
        })

        const lastCandle = sorted[sorted.length - 1]
        return lastCandle?.close ?? null
      }
    }),
    {
      name: 'phillygas-storage',
      partialize: (state) => ({
        theme: state.theme,
        sortOrder: state.sortOrder,
        show3D: state.show3D,
        panelOpen: state.panelOpen,
        viewState: state.viewState,
      }),
    }
  )
)

function applyTheme(theme) {
  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('phillygas-storage')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.theme) {
        applyTheme(state.theme)
      }
    } catch (e) {}
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = localStorage.getItem('phillygas-storage')
    if (currentTheme) {
      try {
        const { state } = JSON.parse(currentTheme)
        if (state?.theme === 'system') {
          applyTheme('system')
        }
      } catch (err) {}
    }
  })
}
