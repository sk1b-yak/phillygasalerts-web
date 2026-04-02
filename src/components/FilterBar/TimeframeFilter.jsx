import { useStore } from '../../stores/useStore'

const TIMEFRAME_OPTIONS = [
  { key: '6h',  label: '6H'  },
  { key: '24h', label: '24H' },
  { key: '3d',  label: '3D'  },
  { key: '7d',  label: '7D'  },
  { key: 'all', label: 'All' },
]

export function TimeframeFilter() {
  const selectedTimeframe = useStore(s => s.selectedTimeframe)
  const setTimeframe = useStore(s => s.setTimeframe)

  return (
    <div className="flex items-center gap-1">
      {TIMEFRAME_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTimeframe(key)}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all duration-200 ${
            selectedTimeframe === key
              ? 'bg-[#006BB6] text-white'
              : 'bg-transparent text-white/40 hover:text-white/60'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default TimeframeFilter
