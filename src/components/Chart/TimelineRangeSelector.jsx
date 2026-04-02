import { useStore } from '../../stores/useStore'

const RANGES = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

const AGGREGATIONS = [
  { label: 'Raw', value: 'raw' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
]

export function TimelineRangeSelector() {
  const timeRange = useStore(s => s.historyTimeRange)
  const setTimeRange = useStore(s => s.setHistoryTimeRange)
  const aggregation = useStore(s => s.historyAggregation)
  const setAggregation = useStore(s => s.setHistoryAggregation)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors duration-200
              ${timeRange === value
                ? 'bg-philly-blue text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {AGGREGATIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setAggregation(value)}
            className={`
              px-2 py-0.5 text-xs font-medium rounded transition-colors duration-200 border
              ${aggregation === value
                ? 'border-philly-blue bg-philly-blue/10 text-philly-blue'
                : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
