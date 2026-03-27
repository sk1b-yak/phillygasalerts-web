import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getPriceColor } from '../../utils/colors'
import { formatPrice } from '../../utils/formatters'
import { StationPopup } from './StationPopup'
import { useStore } from '../../stores/useStore'

// Fix for default marker icon issue in Leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export function StationMarker({ station, minPrice, maxPrice }) {
  const { setSelectedStation, selectedStation } = useStore()
  const hasReliableLocation = station.has_reliable_location && station.lat != null && station.lng != null

  if (!hasReliableLocation) {
    return null
  }

  const position = [station.lat, station.lng]
  
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
