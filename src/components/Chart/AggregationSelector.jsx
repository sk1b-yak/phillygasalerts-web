import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../../stores/useStore'
import { ChevronDown, Check, Building2, MapPin, Globe } from 'lucide-react'

const AGGREGATION_OPTIONS = [
  { key: 'station', label: 'Station', icon: Building2 },
  { key: 'zip', label: 'ZIP', icon: MapPin },
  { key: 'global', label: 'Global', icon: Globe },
]

export function AggregationSelector() {
  const records = useStore(s => s.historyRecords)
  const selectedAggregationLevels = useStore(s => s.selectedAggregationLevels)
  const selectedStations = useStore(s => s.selectedStations)
  const selectedZips = useStore(s => s.selectedZips)
  const setAggregationLevel = useStore(s => s.setAggregationLevel)
  const toggleAggregationLevel = useStore(s => s.toggleAggregationLevel)
  const toggleSelectedStation = useStore(s => s.toggleSelectedStation)
  const toggleSelectedZip = useStore(s => s.toggleSelectedZip)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Get unique stations and zips from records
  const availableStations = useMemo(() => {
    const names = new Set(records.map(r => r.station_name).filter(Boolean))
    return Array.from(names).sort()
  }, [records])

  const availableZips = useMemo(() => {
    const zips = new Set(records.map(r => r.zip_code).filter(Boolean))
    return Array.from(zips).sort()
  }, [records])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Handle aggregation button click with multi-select support
  const handleAggregationClick = (key, event) => {
    const isModifierClick = event.ctrlKey || event.metaKey

    if (isModifierClick) {
      // Ctrl/Cmd+Click: Toggle without deselecting others
      toggleAggregationLevel(key)
    } else {
      // Normal click: Select only this option
      setAggregationLevel(key)
    }
  }

  // Determine if dropdown should be shown
  const showStationDropdown = selectedAggregationLevels.includes('station') && availableStations.length > 0
  const showZipDropdown = selectedAggregationLevels.includes('zip') && availableZips.length > 0

  // Get dropdown label based on selection
  const getDropdownLabel = () => {
    if (showStationDropdown && selectedStations.length > 0) {
      return `${selectedStations.length} Station${selectedStations.length !== 1 ? 's' : ''}`
    }
    if (showZipDropdown && selectedZips.length > 0) {
      return `${selectedZips.length} ZIP${selectedZips.length !== 1 ? 's' : ''}`
    }
    if (selectedAggregationLevels.includes('global') || selectedAggregationLevels.length === 0) {
      return 'All Stations'
    }
    return 'Select...'
  }

  // Get dropdown items based on selected aggregation levels
  const getDropdownItems = () => {
    const items = []
    if (showStationDropdown) {
      availableStations.forEach(station => {
        items.push({ type: 'station', value: station, label: station })
      })
    }
    if (showZipDropdown) {
      availableZips.forEach(zip => {
        items.push({ type: 'zip', value: zip, label: zip })
      })
    }
    return items
  }

  const dropdownItems = getDropdownItems()

  return (
    <div className="flex items-center gap-2">
      {/* Aggregation toggle buttons */}
      <div className="flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
        {AGGREGATION_OPTIONS.map(({ key, label, icon: Icon }, index) => {
          const isSelected = selectedAggregationLevels.includes(key)
          return (
            <button
              key={key}
              onClick={(e) => handleAggregationClick(key, e)}
              title={`${label}${key !== 'global' ? ' (Ctrl/Cmd+Click for multi-select)' : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-philly-blue text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${index < AGGREGATION_OPTIONS.length - 1 ? 'border-r border-slate-300 dark:border-slate-600' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Dropdown for specific selection */}
      {(showStationDropdown || showZipDropdown) && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              selectedStations.length > 0 || selectedZips.length > 0
                ? 'bg-philly-blue/10 border-philly-blue text-philly-blue dark:bg-philly-blue/20 dark:border-philly-blue dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{getDropdownLabel()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && dropdownItems.length > 0 && (
            <div className="absolute left-0 mt-2 w-64 max-h-72 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2">
              {/* Section header */}
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {showStationDropdown && showZipDropdown ? 'Stations & ZIPs' : showStationDropdown ? 'Select Stations' : 'Select ZIPs'}
                </p>
              </div>

              {/* Dropdown items */}
              <div className="px-3 py-2 space-y-1">
                {dropdownItems.map(({ type, value, label }) => {
                  const isSelected = type === 'station'
                    ? selectedStations.includes(value)
                    : selectedZips.includes(value)
                  const toggleFn = type === 'station' ? toggleSelectedStation : toggleSelectedZip

                  return (
                    <button
                      key={`${type}-${value}`}
                      onClick={() => toggleFn(value)}
                      className="flex items-center gap-2 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-2 py-1.5 transition-colors group"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-philly-blue border-philly-blue'
                          : 'border-slate-300 dark:border-slate-500 group-hover:border-philly-blue/50'
                      }`}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {type === 'station' ? (
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                          {label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer with selection count */}
              <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {selectedStations.length + selectedZips.length} selected
                  {(selectedStations.length > 0 || selectedZips.length > 0) && (
                    <button
                      onClick={() => {
                        useStore.setState({ selectedStations: [], selectedZips: [] })
                      }}
                      className="ml-2 text-philly-blue hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* When global is selected and no other levels, show "All Stations" label */}
      {selectedAggregationLevels.includes('global') && selectedAggregationLevels.length === 1 && (
        <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
          All Stations
        </span>
      )}
    </div>
  )
}
