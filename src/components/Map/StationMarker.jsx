import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import { getPriceColor } from '../../utils/colors'
import { formatPrice } from '../../utils/formatters'
import { StationPopup } from './StationPopup'
import { useStore } from '../../stores/useStore'

export function StationMarker({ map, station, minPrice, maxPrice }) {
  const markerRef = useRef(null)
  const popupRef = useRef(null)
  const rootRef = useRef(null)
  const { setSelectedStation, selectedStation } = useStore()
  
  const hasReliableLocation = station.has_reliable_location && station.lat != null && station.lng != null

  useEffect(() => {
    if (!hasReliableLocation || !map) return

    // Create marker DOM element
    const el = document.createElement('div')
    el.className = 'custom-marker'
    
    // Create popup DOM element
    const popupNode = document.createElement('div')
    rootRef.current = createRoot(popupNode)
    rootRef.current.render(<StationPopup station={station} />)
    
    // Initialize popup
    popupRef.current = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px'
    }).setDOMContent(popupNode)
    
    // Initialize marker
    markerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([station.lng, station.lat])
      .setPopup(popupRef.current)
      .addTo(map)
      
    // Add click event listener to the marker element
    el.addEventListener('click', () => {
      setSelectedStation(station)
    })
    
    // Add close event listener to popup
    popupRef.current.on('close', () => {
      // Only clear if this is the currently selected station
      if (useStore.getState().selectedStation?.station_name === station.station_name) {
        setSelectedStation(null)
      }
    })

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount()
      }
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, station.lng, station.lat, hasReliableLocation]) // Re-create if location changes

  // Update marker appearance when selection or price changes
  useEffect(() => {
    if (!markerRef.current) return
    
    const el = markerRef.current.getElement()
    const color = getPriceColor(station.price_regular, minPrice, maxPrice)
    const isSelected = selectedStation?.station_name === station.station_name
    
    el.innerHTML = `
      <div style="
        width: ${isSelected ? '40px' : '32px'};
        height: ${isSelected ? '40px' : '32px'};
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 11px;
        color: white;
        transition: all 0.2s ease;
        ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        ${formatPrice(station.price_regular).replace('$', '')}
      </div>
    `
    
    // Handle popup visibility based on selection
    if (isSelected && !popupRef.current.isOpen()) {
      markerRef.current.togglePopup()
    } else if (!isSelected && popupRef.current.isOpen()) {
      markerRef.current.togglePopup()
    }
    
  }, [selectedStation, station.price_regular, minPrice, maxPrice])

  return null
}
