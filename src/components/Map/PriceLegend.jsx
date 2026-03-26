import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '../../utils/formatters'
import clsx from 'clsx'

export function PriceLegend({ min, max, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  
  const colors = [
    { color: '#006BB6', label: 'Cheapest', position: 0 },
    { color: '#22C55E', label: 'Low', position: 25 },
    { color: '#FCD116', label: 'Average', position: 50 },
    { color: '#F97316', label: 'High', position: 75 },
    { color: '#C61E2E', label: 'Expensive', position: 100 },
  ]
  
  if (compact) {
    return (
      <div className="card px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Price:</span>
          <div className="flex items-center gap-1">
            <span className="font-medium text-philly-blue">{formatPrice(min)}</span>
            <span className="text-slate-400">-</span>
            <span className="font-medium text-philly-crimson">{formatPrice(max)}</span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Price Legend
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-3">
          {/* Gradient bar */}
          <div className="relative h-4 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${colors.map(c => c.color).join(', ')})`,
              }}
            />
          </div>
          
          {/* Labels */}
          <div className="flex justify-between text-xs">
            <div className="text-center">
              <p className="font-medium text-philly-blue">{formatPrice(min)}</p>
              <p className="text-slate-500">Cheapest</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-philly-gold">{formatPrice((min + max) / 2)}</p>
              <p className="text-slate-500">Average</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-philly-crimson">{formatPrice(max)}</p>
              <p className="text-slate-500">Most</p>
            </div>
          </div>
          
          {/* Color key */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
            {colors.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
