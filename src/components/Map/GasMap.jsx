import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { StationMarker } from './StationMarker'
import { PriceLegend } from './PriceLegend'
import { StatsCard } from '../UI/StatsCard'
import { SearchBar } from '../UI/SearchBar'
import { SortToggle } from '../UI/SortToggle'
import { LoadingSpinner } from '../UI/LoadingSpinner'
import 'leaflet/dist/leaflet.css'

// Philadelphia center coordinates
const PHILLY_CENTER = [39.9526, -75.1652]
const DEFAULT_ZOOM = 12

function MapController() {
  const map = useMap()
  const { selectedStation } = useStore()
  
  useEffect(() => {
    if (selectedStation?.has_reliable_location && selectedStation.lat && selectedStation.lng) {
      map.flyTo([selectedStation.lat, selectedStation.lng], 15, {
        duration: 0.5
      })
    }
  }, [selectedStation, map])
  
  return null
}

export function GasMap() {
  const { 
    getFilteredStations, 
    getPriceRange, 
    isLoading, 
    error,
    showHeatmap,
    toggleHeatmap,
    showMobileControls 
  } = useStore()
  const { reload } = useGasPrices()
  
  const filteredStations = getFilteredStations()
  const mappableStations = filteredStations.filter(
    (station) => station.has_reliable_location && station.lat != null && station.lng != null
  )
  const unmappedStations = filteredStations.length - mappableStations.length
  const { min, max } = getPriceRange()
  
  // Create heatmap layer reference
  const heatLayerRef = useRef(null)
  
  // Custom tile layers
  const tileLayers = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  }
  
  // Get current tile layer based on theme
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  
  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
        <div className="space-y-4">
          <SearchBar />
          <SortToggle />
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHeatmap}
              className={`btn-secondary text-sm flex-1 ${showHeatmap ? 'bg-philly-gold text-slate-900 border-philly-gold' : ''}`}
            >
              Heatmap
            </button>
            <button
              onClick={reload}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>
          
          <StatsCard />
          
          <PriceLegend min={min} max={max} />
          
          <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400 text-center">
            <div>Showing {filteredStations.length} stations</div>
            <div>{mappableStations.length} mapped with trusted coordinates</div>
            {unmappedStations > 0 && (
              <div className="text-amber-600 dark:text-amber-400">
                {unmappedStations} hidden until location is verified
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Mobile Controls */}
      {showMobileControls && (
        <div className="lg:hidden absolute bottom-20 left-4 right-4 z-[1000] card p-4 space-y-3">
          <SearchBar />
          <div className="flex gap-2">
            <SortToggle />
            <button
              onClick={toggleHeatmap}
              className={`btn-secondary text-sm flex-1 ${showHeatmap ? 'bg-philly-gold text-slate-900 border-philly-gold' : ''}`}
            >
              Heatmap
            </button>
            <button
              onClick={reload}
              className="btn-secondary text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
      
      {/* Map */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-[500]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-slate-500">Loading stations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-[500]">
            <div className="text-center p-4">
              <p className="text-philly-crimson font-medium">Failed to load data</p>
              <p className="text-sm text-slate-500 mt-1">{error}</p>
              <button onClick={reload} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <MapContainer
            center={PHILLY_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              url={tileLayers[currentTheme].url}
              attribution={tileLayers[currentTheme].attribution}
            />
            
            <MapController />
            
            {mappableStations.map((station) => (
              <StationMarker
                key={`${station.station_name}-${station.address}`}
                station={station}
                minPrice={min}
                maxPrice={max}
              />
            ))}
          </MapContainer>
        )}
        
        {/* Mobile floating controls */}
        <button
          onClick={() => useStore.getState().toggleMobileControls()}
          className="lg:hidden absolute bottom-4 right-4 z-[1000] btn-primary shadow-lg"
        >
          Filters
        </button>
        
        {/* Legend for mobile */}
        <div className="lg:hidden absolute bottom-4 left-4 z-[1000]">
          <PriceLegend min={min} max={max} compact />
        </div>
      </div>
    </div>
  )
}
