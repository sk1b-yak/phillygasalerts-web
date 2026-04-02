import { Flame, TrendingDown, TrendingUp, MapPin } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { formatPrice } from '../../utils/formatters'

// Condensed single-line stats for mobile peek bar
export function StatsBarCondensed() {
  const { getPriceRange, getFilteredStations, isLoading } = useStore()
  const { min, max } = getPriceRange()
  const count = getFilteredStations().length

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <span className="text-philly-blue font-bold">{formatPrice(min)}</span>
      <span className="text-slate-400">-</span>
      <span className="text-philly-crimson font-bold">{formatPrice(max)}</span>
      <span className="text-slate-400 mx-1">&middot;</span>
      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {count} stations
      </span>
    </div>
  )
}

// Horizontal pill-style stats for desktop side panel
export function StatsCard() {
  const { stats, getPriceRange, getFilteredStations, isLoading } = useStore()
  const { min, max, avg } = getPriceRange()
  const count = getFilteredStations().length

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 p-2.5">
            <div className="skeleton h-3 w-12 mb-1.5 rounded" />
            <div className="skeleton h-5 w-10 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const items = [
    {
      label: 'Low',
      value: formatPrice(min),
      icon: TrendingDown,
      color: 'text-philly-blue',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Avg',
      value: formatPrice(avg),
      icon: Flame,
      color: 'text-philly-gold',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'High',
      value: formatPrice(max),
      icon: TrendingUp,
      color: 'text-philly-crimson',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {items.map((item) => (
          <div key={item.label} className={`flex-1 rounded-lg ${item.bg} px-3 py-2`}>
            <div className="flex items-center gap-1 mb-0.5">
              <item.icon className={`w-3 h-3 ${item.color}`} />
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {item.label}
              </span>
            </div>
            <p className={`text-lg font-bold ${item.color} leading-tight`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{count} stations</span>
        <span>{stats?.last_updated || 'Updated recently'}</span>
      </div>
    </div>
  )
}
