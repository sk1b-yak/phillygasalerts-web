import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../../stores/useStore'

const COMPUTATIONS = [
  { key: 'sma7', label: 'SMA 7', color: '#FCD116' },
  { key: 'sma30', label: 'SMA 30', color: '#F97316' },
  { key: 'ema12', label: 'EMA 12', color: '#6B9F4D' },
  { key: 'minMaxBand', label: 'Min/Max Band', color: '#C61E2E' },
  { key: 'volatilityBands', label: 'Volatility Bands', color: '#7B61FF' },
  { key: 'percentiles', label: 'Percentiles', color: '#006BB6' },
  { key: 'trendLine', label: 'Trend Line', color: '#7B61FF' },
]

export function ComputationToggle() {
  const [collapsed, setCollapsed] = useState(true)
  const enabledComputations = useStore(s => s.enabledComputations)
  const toggleComputation = useStore(s => s.toggleComputation)

  return (
    <div className="border-t border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <span>Indicators</span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {!collapsed && (
        <div className="px-3 pb-2 space-y-1">
          {COMPUTATIONS.map(({ key, label, color }) => {
            const enabled = enabledComputations[key]
            return (
              <button
                key={key}
                onClick={() => toggleComputation(key)}
                className="w-full flex items-center justify-between py-1 text-xs"
              >
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
                {enabled
                  ? <Eye size={14} className="text-slate-500" />
                  : <EyeOff size={14} className="text-slate-300 dark:text-slate-600" />
                }
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
