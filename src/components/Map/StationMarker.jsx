import { Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { getPriceColor } from '../../utils/colors'
import { formatPrice } from '../../utils/formatters'
import { StationPopup } from './StationPopup'

// Fix for default marker icon issue in Leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export function StationMarker({ station, minPrice, maxPrice }) {
  const [position, setPosition] = useState([null, null])
  const [isLoading, setIsLoading] = useState(true)
  const { setSelectedStation, selectedStation } = require('../../stores/useStore').useStore()
  
  // Geocode address if lat/lng not available
  useEffect(() => {
    if (station.lat && station.lng) {
      setPosition([station.lat, station.lng])
      setIsLoading(false)
      return
    }
    
    // Try to get cached position from localStorage
    const cacheKey = `geo_${station.address}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const [lat, lng] = JSON.parse(cached)
        setPosition([lat, lng])
        setIsLoading(false)
        return
      } catch (e) {
        localStorage.removeItem(cacheKey)
      }
    }
    
    // For now, use a placeholder - in production, geocode the address
    // This is a simplified version - full geocoding would require an API
    const geocodeAddress = async () => {
      // Placeholder: use ZIP code center as fallback
      // In production, use a geocoding service like Nominatim, Google, etc.
      const zipCenters = {
        '19103': [39.9526, -75.1652],
        '19107': [39.9489, -75.1587],
        '19125': [39.9772, -75.1327],
        '19123': [39.9664, -75.1446],
        '19145': [39.9425, -75.1809],
        '19146': [39.9390, -75.1825],
        '19147': [39.9360, -75.1554],
        '19148': [39.9300, -75.1500],
        '19120': [40.0330, -75.0880],
        '19121': [39.9812, -75.1725],
        '19122': [39.9734, -75.1370],
        '19124': [40.0000, -75.0850],
        '19130': [39.9660, -75.1720],
        '19131': [39.9770, -75.1900],
        '19132': [39.9950, -75.1700],
        '19133': [39.9800, -75.1450],
        '19134': [39.9900, -75.1100],
        '19135': [40.0100, -75.1000],
        '19138': [40.0600, -75.1500],
        '19139': [39.9500, -75.2000],
        '19140': [40.0000, -75.1450],
        '19141': [40.0350, -75.1350],
        '19144': [40.0500, -75.1650],
        '19142': [39.9200, -75.2200],
        '19143': [39.9350, -75.2150],
        '19153': [39.9000, -75.2300],
        '19128': [40.0450, -75.2200],
        '19136': [40.0200, -75.0400],
        '19126': [40.0550, -75.0750],
        '19149': [40.0350, -75.0500],
      }
      
      const center = zipCenters[station.zip_code] || [39.9526, -75.1652]
      // Add small random offset to prevent marker overlap
      const offset = Math.random() * 0.01 - 0.005
      setPosition([center[0] + offset, center[1] + offset])
      setIsLoading(false)
      
      // Cache the position
      localStorage.setItem(cacheKey, JSON.stringify([center[0] + offset, center[1] + offset]))
    }
    
    geocodeAddress()
  }, [station.address, station.zip_code, station.lat, station.lng])
  
  if (isLoading || !position[0] || !position[1]) {
    return null
  }
  
  const color = getPriceColor(station.price_regular, minPrice, maxPrice)
  const isSelected = selectedStation?.station_name === station.station_name
  
  // Create custom icon
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
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
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
    popupAnchor: [0, -20],
  })
  
  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => setSelectedStation(station),
      }}
    >
      <Popup>
        <StationPopup station={station} />
      </Popup>
    </Marker>
  )
}
