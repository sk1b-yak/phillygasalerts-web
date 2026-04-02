import { useStore } from '../../stores/useStore'
import { TimeframeFilter } from './TimeframeFilter'

const VIEW_MODES = [
  { key: 'auto', label: 'Auto' },
  { key: 'chart', label: 'Price History' }
]

export function UnifiedFilterBar() {
  const viewMode = useStore(s => s.viewMode)
  const setViewMode = useStore(s => s.setViewMode)
  const getFilteredHistory = useStore(s => s.getFilteredHistory)
  const selectedTimeframe = useStore(s => s.selectedTimeframe)

  const filteredRecords = getFilteredHistory()
  const recordCount = filteredRecords.length

  const timeframeDisplay = {
    '2h': '2h',
    '4h': '4h',
    '6h': '6h',
    '24h': '24h',
    '7d': '7d',
    '30d': '30d',
    '90d': '90d',
    'all': 'All'
  }[selectedTimeframe] || selectedTimeframe

  return (
    <div className="px-4 py-3 bg-[#0a0e1a] border-b border-white/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                viewMode === key
                  ? 'bg-[#006BB6] text-white'
                  : 'bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">

          <div className="text-xs text-white/40">
            <span className="font-medium text-white/60">{recordCount.toLocaleString()}</span>
            {' '}records · {timeframeDisplay}
          </div>
        </div>
      </div>



      <div className="flex items-center gap-4 mb-3">
        <TimeframeFilter />


      </div>

    </div>
  )
}

export default UnifiedFilterBar
