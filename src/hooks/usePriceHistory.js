import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { fetchHistory } from '../services/api'

export function usePriceHistory() {
  const historyFilters = useStore((s) => s.historyFilters)
  const historyTimeRange = useStore((s) => s.historyTimeRange)
  const historyRecords = useStore((s) => s.historyRecords)
  const historyLoading = useStore((s) => s.historyLoading)
  const historyError = useStore((s) => s.historyError)
  const setHistoryLoading = useStore((s) => s.setHistoryLoading)
  const setHistoryRecords = useStore((s) => s.setHistoryRecords)
  const setHistoryError = useStore((s) => s.setHistoryError)

  const fetchData = async () => {
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const params = { ...historyFilters }
      if (historyTimeRange && historyTimeRange !== 'all') {
        params.timeRange = historyTimeRange
      } else {
        // For "All" timeframe, request higher limit to get all historical data
        params.limit = 100000
      }
      const response = await fetchHistory(params)
      const records = Array.isArray(response)
        ? response
        : response.data || response.records || []
      setHistoryRecords(records)
    } catch (error) {
      console.error('Failed to load price history:', error)
      setHistoryError(error.message || 'Failed to fetch price history')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [historyFilters, historyTimeRange])

  return {
    records: historyRecords,
    loading: historyLoading,
    error: historyError,
    refetch: fetchData,
  }
}
