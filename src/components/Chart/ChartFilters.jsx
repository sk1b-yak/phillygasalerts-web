import { useMemo } from 'react'
import { useStore } from '../../stores/useStore'

export function ChartFilters() {
  const records = useStore(s => s.historyRecords)
  const filters = useStore(s => s.historyFilters)
  const setHistoryFilters = useStore(s => s.setHistoryFilters)

  const aggregationLevel = filters.aggregation_level || 'station'

  const zipCodes = useMemo(() => {
    const zips = new Set(records.map(r => r.zip_code).filter(Boolean))
    return ['all', ...Array.from(zips).sort()]
  }, [records])

  const stations = useMemo(() => {
    const names = new Set(records.map(r => r.station_name).filter(Boolean))
    return ['all', ...Array.from(names).sort()]
  }, [records])

  const handleAggregationChange = (level) => {
    setHistoryFilters({
      aggregation_level: level,
      zip_code: null,
      station_name: null
    })
  }

  const aggButtons = [
    { key: 'station', label: 'Station' },
    { key: 'zip', label: 'ZIP' },
    { key: 'global', label: 'Global' }
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
        {aggButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleAggregationChange(key)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              aggregationLevel === key
                ? 'bg-philly-blue text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${key !== 'global' ? 'border-r border-slate-300 dark:border-slate-600' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {aggregationLevel === 'station' && (
        <select
          value={filters.station_name || 'all'}
          onChange={(e) => setHistoryFilters({ station_name: e.target.value === 'all' ? null : e.target.value })}
          className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-philly-blue focus:border-philly-blue max-w-[200px]"
        >
          <option value="all">All Stations</option>
          {stations.filter(s => s !== 'all').map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      )}

      {aggregationLevel === 'zip' && (
        <select
          value={filters.zip_code || 'all'}
          onChange={(e) => setHistoryFilters({ zip_code: e.target.value === 'all' ? null : e.target.value })}
          className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-philly-blue focus:border-philly-blue"
        >
          <option value="all">All ZIPs</option>
          {zipCodes.filter(z => z !== 'all').map(zip => (
            <option key={zip} value={zip}>{zip}</option>
          ))}
        </select>
      )}
    </div>
  )
}
