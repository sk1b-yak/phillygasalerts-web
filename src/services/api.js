import axios from 'axios'

// API base URL - change this for production
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data)
    } else if (error.request) {
      console.error('[API] No response received:', error.message)
    } else {
      console.error('[API] Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const fetchPrices = async () => {
  try {
    const response = await api.get('/prices')
    return response.data
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    throw error
  }
}

export const fetchPricesByZip = async (zip) => {
  try {
    const response = await api.get(`/prices/${zip}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch prices for ZIP ${zip}:`, error)
    throw error
  }
}

export const fetchTopDeals = async (limit = 10) => {
  try {
    const response = await api.get(`/top-deals?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch top deals:', error)
    throw error
  }
}

export const fetchStats = async () => {
  try {
    const response = await api.get('/stats')
    return response.data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    throw error
  }
}

export const fetchHealth = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('Failed to fetch health:', error)
    throw error
  }
}

/**
 * Fetch price history records with optional filters.
 * @param {Object} [params] - Query parameters
 * @param {string} [params.zip_code] - Optional ZIP code filter
 * @param {string} [params.station_name] - Optional station name filter
 * @param {number} [params.limit] - Maximum records to return (default 10000)
 * @returns {Promise<Object>} History response data
 */
export const fetchHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (params.zip_code) queryParams.append('zip_code', params.zip_code)
    if (params.station_name) queryParams.append('station_name', params.station_name)
    if (params.limit) queryParams.append('limit', String(params.limit))

    const queryString = queryParams.toString()
    const url = queryString ? `/history?${queryString}` : '/history'
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error('Failed to fetch history:', error)
    throw error
  }
}

export default api
