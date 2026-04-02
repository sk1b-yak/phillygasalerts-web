import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { Filter, Check, ChevronDown } from 'lucide-react'

const DATA_SOURCES = [
  { key: 'zyla', label: 'Zyla Labs', description: 'Primary data provider' },
  { key: 'google', label: 'Google Places', description: 'Google Maps data' },
  { key: 'gasbuddy', label: 'GasBuddy', description: 'Community reports (blocked by Cloudflare)' },
  { key: 'waze', label: 'Waze', description: 'Waze user reports' },
  { key: 'other', label: 'Other', description: 'Miscellaneous sources' },
]

export function DataSourceFilter() {
  const selectedDataSources = useStore(s => s.selectedDataSources)
  const setSelectedDataSources = useStore(s => s.setSelectedDataSources)
  const toggleDataSource = useStore(s => s.toggleDataSource)
  const clearDataSourceFilter = useStore(s => s.clearDataSourceFilter)

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const allSelected = selectedDataSources.length === DATA_SOURCES.length
  const someSelected = selectedDataSources.length > 0 && !allSelected
  const selectedCount = selectedDataSources.length

  const handleToggleAll = () => {
    if (allSelected) {
      clearDataSourceFilter()
    } else {
      setSelectedDataSources(DATA_SOURCES.map(s => s.key))
    }
  }

  const handleToggleSource = (key) => {
    toggleDataSource(key)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
          someSelected || (selectedCount > 0 && selectedCount < DATA_SOURCES.length)
            ? 'bg-philly-blue/10 border-philly-blue text-philly-blue dark:bg-philly-blue/20 dark:border-philly-blue dark:text-blue-300'
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>Sources</span>
        {selectedCount > 0 && selectedCount < DATA_SOURCES.length && (
          <span className="ml-1 px-1.5 py-0.5 bg-philly-blue text-white text-[10px] rounded-full">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-2 py-1.5 transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                allSelected
                  ? 'bg-philly-blue border-philly-blue'
                  : someSelected
                    ? 'bg-philly-blue/50 border-philly-blue'
                    : 'border-slate-300 dark:border-slate-500'
              }`}>
                {(allSelected || someSelected) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                All Sources
              </span>
            </button>
          </div>

          <div className="px-3 py-2 space-y-1">
            {DATA_SOURCES.map(({ key, label, description }) => {
              const isSelected = selectedDataSources.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => handleToggleSource(key)}
                  className="flex items-start gap-2 w-full text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-2 py-2 transition-colors group"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-philly-blue border-philly-blue'
                      : 'border-slate-300 dark:border-slate-500 group-hover:border-philly-blue/50'
                  }`}>
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      {label}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {selectedCount} of {DATA_SOURCES.length} sources selected
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
