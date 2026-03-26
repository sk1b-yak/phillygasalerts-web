import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // Stations data
      stations: [],
      setStations: (stations) => set({ stations }),
      
      // Filters
      sortOrder: 'asc', // 'asc' = cheapest first, 'desc' = most expensive first
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
      showHeatmap: false,
      toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
      
      selectedStation: null,
      setSelectedStation: (station) => set({ selectedStation: station }),
      
      showMobileControls: false,
      toggleMobileControls: () => set((state) => ({ 
        showMobileControls: !state.showMobileControls 
      })),
      
      // Theme
      theme: 'system', // 'light', 'dark', 'system'
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
      
      // Loading states
      isLoading: true,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      error: null,
      setError: (error) => set({ error }),
      
      // Stats
      stats: null,
      setStats: (stats) => set({ stats }),
      
      // Computed: filtered and sorted stations
      getFilteredStations: () => {
        const { stations, sortOrder, selectedZip, searchQuery } = get()
        
        let filtered = [...stations]
        
        // Filter by ZIP
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
        
        // Sort by price
        filtered.sort((a, b) => {
          if (sortOrder === 'asc') {
            return parseFloat(a.price_regular) - parseFloat(b.price_regular)
          } else {
            return parseFloat(b.price_regular) - parseFloat(a.price_regular)
          }
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
      }
    }),
    {
      name: 'phillygas-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sortOrder: state.sortOrder,
        showHeatmap: state.showHeatmap
      }),
    }
  )
)

// Helper function to apply theme
function applyTheme(theme) {
  const root = document.documentElement
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('phillygas-storage')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.theme) {
        applyTheme(state.theme)
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
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
