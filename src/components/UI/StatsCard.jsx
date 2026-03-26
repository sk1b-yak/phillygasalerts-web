import { Flame, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { formatPrice } from '../../utils/formatters'

export function StatsCard() {
  const { stats, getPriceRange, isLoading } = useStore()
  const { min, max, avg } = getPriceRange()
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }
  
  const statItems = [
    {
      label: 'Cheapest',
      value: formatPrice(min),
      icon: TrendingDown,
      color: 'text-philly-blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Average',
      value: formatPrice(avg),
      icon: Flame,
      color: 'text-philly-gold',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
    },
    {
      label: 'Most Expensive',
      value: formatPrice(max),
      icon: TrendingUp,
      color: 'text-philly-crimson',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
    },
    {
      label: 'Last Updated',
      value: stats?.last_updated || 'Recently',
      icon: Clock,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-700',
    },
  ]
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className={`card p-4 ${item.bgColor}`}>
          <div className="flex items-center gap-2 mb-1">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
          </div>
          <p className={`text-xl font-bold ${item.color}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}
