import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { StationMarker } from './StationMarker'
import { PriceLegend } from './PriceLegend'
import { StatsCard } from '../UI/StatsCard'
import { SearchBar } from '../UI/SearchBar'
import { SortToggle } from '../UI/SortToggle'
import { LoadingSpinner } from '../UI/LoadingSpinner'

const PHILLY_CENTER = [-75.1652, 39.9526]
const DEFAULT_ZOOM = 12

function getMapStyle(theme) {
  const tiles = theme === 'dark' 
    ? [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ]
    : [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ]
    
  return {
    version: 8,
    sources: {
      'carto-tiles': {
        type: 'raster',
        tiles: tiles,
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-tiles-layer',
        type: 'raster',
        source: 'carto-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  }
}

export function GasMap() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const { 
    getFilteredStations, 
    getPriceRange, 
    isLoading, 
    error,
    showHeatmap,
    toggleHeatmap,
    showMobileControls,
    selectedStation
  } = useStore()
  const { reload } = useGasPrices()
  
  const filteredStations = getFilteredStations()
  const mappableStations = filteredStations.filter(
    (station) => station.has_reliable_location && station.lat != null && station.lng != null
  )
  const unmappedStations = filteredStations.length - mappableStations.length
  const { min, max } = getPriceRange()
  
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  
  useEffect(() => {
    if (map.current) return // initialize map only once
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(currentTheme),
      center: PHILLY_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update style when theme changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return
    map.current.setStyle(getMapStyle(currentTheme))
  }, [currentTheme, mapLoaded])

  // Fly to selected station
  useEffect(() => {
    if (map.current && mapLoaded && selectedStation?.has_reliable_location && selectedStation.lat && selectedStation.lng) {
      map.current.flyTo({
        center: [selectedStation.lng, selectedStation.lat],
        zoom: 15,
        essential: true
      })
    }
  }, [selectedStation, mapLoaded])

  return (
    <div className="flex flex-col lg:flex-row h-full">
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
      
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/80 z-[500] backdrop-blur-sm">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-slate-500">Loading stations...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 z-[500] backdrop-blur-sm">
            <div className="text-center p-4">
              <p className="text-philly-crimson font-medium">Failed to load data</p>
              <p className="text-sm text-slate-500 mt-1">{error}</p>
              <button onClick={reload} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          </div>
        )}
        
        <div ref={mapContainer} className="h-full w-full" />
        
        {mapLoaded && mappableStations.map(station => (
          <StationMarker 
            key={station.station_name} 
            map={map.current} 
            station={station} 
            minPrice={min} 
            maxPrice={max} 
          />
        ))}
        
        <button
          onClick={() => useStore.getState().toggleMobileControls()}
          className="lg:hidden absolute bottom-4 right-4 z-[1000] btn-primary shadow-lg"
        >
          Filters
        </button>
        
        <div className="lg:hidden absolute bottom-4 left-4 z-[1000]">
          <PriceLegend min={min} max={max} compact />
        </div>
      </div>
    </div>
  )
}
