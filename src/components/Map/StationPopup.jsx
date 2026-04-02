import { MapPin, Clock, Navigation, ExternalLink } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '../../utils/formatters'
import { getPriceColor, getPriceLabel } from '../../utils/colors'

export function StationPopup({ station }) {
  const color = getPriceColor(station.price_regular, station.price_regular, station.price_regular)
  const label = getPriceLabel(station.price_regular, station.price_regular, station.price_regular)
  const confidenceLabel = station.location_confidence === 'geocoded'
    ? 'Address-matched location'
    : station.location_confidence === 'exact'
      ? 'Exact location'
      : 'Location confidence unavailable'
  
  // Generate Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${station.address}, Philadelphia, PA ${station.zip_code}`
  )}`
  
  return (
    <div className="w-64 p-4 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight pr-2">
          {station.station_name}
        </h3>
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>
      
      {/* Price */}
      <div className="mb-3">
        <span className="text-3xl font-bold" style={{ color }}>
          {formatPrice(station.price_regular)}
        </span>
        <span className="text-slate-500 text-sm ml-1">/gallon</span>
      </div>
      
      {/* Details */}
      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-philly-blue" />
          <span>{station.address}, {station.zip_code}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span>Updated {formatRelativeTime(station.time || station.local_time)}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span>{confidenceLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span className="capitalize">
            Source: {station.source || 'unknown'} · {station.validation_status || 'valid'}
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-philly-blue text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Get Directions
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </div>
    </div>
  )
}
