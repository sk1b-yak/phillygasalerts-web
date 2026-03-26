import { useEffect } from 'react'
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
  
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [pricesData, statsData] = await Promise.all([
        fetchPrices(),
        fetchStats()
      ])
      
      // Handle both array and object response formats
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
