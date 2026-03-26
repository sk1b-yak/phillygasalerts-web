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
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
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

export default api
