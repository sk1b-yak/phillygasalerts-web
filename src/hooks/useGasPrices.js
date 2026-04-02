import { useEffect, useRef } from 'react'
import { useStore } from '../stores/useStore'
import { fetchPrices, fetchStats } from '../services/api'

export function useGasPrices() {
  const { 
    setStations, 
    setStats, 
    setIsLoading, 
    setError,
    stations 
  } = useStore()

  const initialConsumed = useRef(false)
  
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // On first load, check if data was baked into HTML via SSI
      if (!initialConsumed.current && window.__INITIAL_PRICES__) {
        initialConsumed.current = true
        const inline = window.__INITIAL_PRICES__
        const stationsArray = Array.isArray(inline)
          ? inline
          : inline.data || inline.stations || []

        setStations(stationsArray)
        // Still fetch stats (tiny payload)
        try {
          const statsData = await fetchStats()
          setStats(statsData)
        } catch (_) { /* stats are optional on first paint */ }
        setIsLoading(false)
        // Clean up to free memory
        delete window.__INITIAL_PRICES__
        return
      }

      const [pricesData, statsData] = await Promise.all([
        fetchPrices(),
        fetchStats()
      ])
      
      const stationsArray = Array.isArray(pricesData) 
        ? pricesData 
        : pricesData.data || pricesData.stations || []
      
      setStations(stationsArray)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError(error.message || 'Failed to load gas prices')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    stations,
    reload: loadData,
    isLoading: useStore((s) => s.isLoading),
    error: useStore((s) => s.error),
  }
}
