import { useCallback } from 'react'
import { useStore } from '../../stores/useStore'
import { formatPrice } from '../../utils/formatters'
import { getPriceColor } from '../../utils/colors'
import { Navigation } from 'lucide-react'
import { getLogo } from '../Logos/registry'



function getRankColor(rank) {
  if (rank === 1) return 'text-emerald-400 font-black'
  if (rank === 2) return 'text-emerald-500/70 font-bold'
  if (rank === 3) return 'text-emerald-500/50 font-bold'
  return 'text-white/20 font-medium'
}

export function StationList({ stations, compact = false }) {
  const { selectedStation, setSelectedStation, flyToStation, getPriceRange, selectedGasType,
          setDirectionsRoute, setDirectionsLoading, setDirectionsError } = useStore()
  const { min, max } = getPriceRange()
  const priceKey = selectedGasType ? `price_${selectedGasType}` : 'price_regular'

  const handleDirections = useCallback((station) => {
    if (!station?.lat || !station?.lng) return
    setDirectionsLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: uLat, longitude: uLng } }) => {
        fetch(
          `https://router.project-osrm.org/route/v1/driving/` +
          `${uLng},${uLat};${station.lng},${station.lat}` +
          `?steps=true&geometries=geojson&overview=full&annotations=false`
        )
          .then(r => r.json())
          .then(data => {
            if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
            setDirectionsRoute(data.routes[0], { lat: uLat, lng: uLng })
          })
          .catch(e => setDirectionsError(e.message || 'Route unavailable'))
      },
      () => setDirectionsError('Location access denied — please allow location in your browser')
    )
  }, [setDirectionsLoading, setDirectionsRoute, setDirectionsError])

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        No stations match your search
      </div>
    )
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      <div className="flex items-center justify-end px-1 pb-1">
        <span className="text-[10px] tracking-wide uppercase text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/30">
          Regular (87)
        </span>
      </div>
      {stations.map((station, idx) => {
        const rank = idx + 1
        const isSelected = selectedStation?.address === station.address
        const price = parseFloat(station[priceKey] || station.price_regular || 0)
        const priceColor = getPriceColor(price, min, max)
        const BrandLogo = getLogo(station.station_name, station.brand)

        return (
          <button
            key={station.address || station.station_name}
            onClick={() => {
              setSelectedStation(station)
              if (station.has_reliable_location && station.lat && station.lng) {
                flyToStation(station)
              }
            }}
            className={`w-full text-left rounded-lg px-2 py-1.5 flex items-center gap-2 transition-all duration-200
              ${isSelected
                ? 'bg-[#006BB6]/15 border border-[#006BB6]/30'
                : 'hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]'
              }`}
          >
            <span className={`text-xs w-5 text-center flex-shrink-0 ${getRankColor(rank)}`}>
              {rank <= 99 ? rank : '—'}
            </span>

            <div className="flex-shrink-0">
              <BrandLogo size={24} isActive={isSelected} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-xs text-white/90 truncate">{station.station_name}</span>
                <span className="font-black text-sm flex-shrink-0 tabular-nums" style={{ color: priceColor }}>
                  {formatPrice(price)}
                </span>
              </div>
              {!compact && (
                <div className="text-[10px] text-white/25 truncate mt-0">
                  {station.address}{station.zip_code ? `, ${station.zip_code}` : ''}
                </div>
              )}
            </div>

            {isSelected && station.has_reliable_location && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDirections(station)
                }}
                className="p-1.5 rounded-full bg-[#006BB6] text-white hover:bg-[#006BB6]/80 flex-shrink-0 transition-colors"
                title="Get directions"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
        )
      })}
    </div>
  )
}
