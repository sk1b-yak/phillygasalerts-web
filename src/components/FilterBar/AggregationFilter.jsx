import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../../stores/useStore'
import { ChevronDown, Check } from 'lucide-react'

const AGGREGATION_LEVELS = [
  { key: 'station', label: 'Station' },
  { key: 'zip', label: 'ZIP' },
  { key: 'global', label: 'Global' }
]

export function AggregationFilter() {
  const historyRecords = useStore(s => s.historyRecords)
  const selectedAggregationLevels = useStore(s => s.selectedAggregationLevels)
  const toggleAggregationLevel = useStore(s => s.toggleAggregationLevel)
  const selectedStations = useStore(s => s.selectedStations)
  const selectedZips = useStore(s => s.selectedZips)
  const toggleSelectedStation = useStore(s => s.toggleSelectedStation)
  const toggleSelectedZip = useStore(s => s.toggleSelectedZip)
  const setSelectedStations = useStore(s => s.setSelectedStations)
  const setSelectedZips = useStore(s => s.setSelectedZips)

  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const stations = useMemo(() => {
    const names = new Set(historyRecords.map(r => r.station_name).filter(Boolean))
    return Array.from(names).sort()
  }, [historyRecords])

  const zipCodes = useMemo(() => {
    const zips = new Set(historyRecords.map(r => r.zip_code).filter(Boolean))
    return Array.from(zips).sort()
  }, [historyRecords])

  const handleLevelClick = (level, event) => {
    if (event.ctrlKey || event.metaKey) {
      toggleAggregationLevel(level)
    } else {
      const currentLevels = selectedAggregationLevels
      const isSelected = currentLevels.includes(level)

      if (isSelected && currentLevels.length === 1) {
        return
      }

      if (!isSelected) {
        const otherLevels = currentLevels.filter(l => l !== level)
        setSelectedStations([])
        setSelectedZips([])
        toggleAggregationLevel(level)
        otherLevels.forEach(l => toggleAggregationLevel(l))
      }
    }
  }

  const getDisplayText = () => {
    if (selectedAggregationLevels.length === 1) {
      const level = selectedAggregationLevels[0]
      if (level === 'global') return 'Global'
      if (level === 'station') {
        if (selectedStations.length === 0) return 'All Stations'
        if (selectedStations.length === 1) return selectedStations[0]
        return `${selectedStations.length} stations`
      }
      if (level === 'zip') {
        if (selectedZips.length === 0) return 'All ZIPs'
        if (selectedZips.length === 1) return selectedZips[0]
        return `${selectedZips.length} ZIPs`
      }
    }
    return `${selectedAggregationLevels.length} levels`
  }

  const isGlobalOnly = selectedAggregationLevels.length === 1 && selectedAggregationLevels[0] === 'global'

  return (
    <div className="flex items-center gap-3" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        {AGGREGATION_LEVELS.map(({ key, label }) => {
          const isSelected = selectedAggregationLevels.includes(key)
          return (
            <button
              key={key}
              onClick={(e) => handleLevelClick(key, e)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-[#006BB6] text-white'
                  : 'bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {!isGlobalOnly && (
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown ? null : 'filter')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl
                       bg-white/[0.02] border border-white/[0.03] text-white/70
                       hover:bg-white/[0.04] hover:text-white transition-all duration-200"
          >
            <span>{getDisplayText()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-[#0d1117] rounded-2xl shadow-2xl border border-white/[0.08] z-50 py-3 max-h-96 overflow-hidden">
              {selectedAggregationLevels.includes('station') && stations.length > 0 && (
                <div className="px-3 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">Stations</span>
                    {selectedStations.length > 0 && (
                      <button
                        onClick={() => setSelectedStations([])}
                        className="text-[10px] text-[#006BB6] hover:text-[#006BB6]/80"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {stations.map(station => (
                      <button
                        key={station}
                        onClick={() => toggleSelectedStation(station)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedStations.includes(station)
                            ? 'bg-[#006BB6] border-[#006BB6]'
                            : 'border-white/20'
                        }`}>
                          {selectedStations.includes(station) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-white/70 truncate">{station}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAggregationLevels.includes('zip') && zipCodes.length > 0 && (
                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase">ZIP Codes</span>
                    {selectedZips.length > 0 && (
                      <button
                        onClick={() => setSelectedZips([])}
                        className="text-[10px] text-[#006BB6] hover:text-[#006BB6]/80"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {zipCodes.map(zip => (
                      <button
                        key={zip}
                        onClick={() => toggleSelectedZip(zip)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedZips.includes(zip)
                            ? 'bg-[#006BB6] border-[#006BB6]'
                            : 'border-white/20'
                        }`}>
                          {selectedZips.includes(zip) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-white/70">{zip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AggregationFilter
