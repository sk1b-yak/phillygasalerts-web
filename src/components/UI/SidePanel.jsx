import { ChevronLeft, ChevronRight, RotateCw, Box } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { StatsCard } from '../UI/StatsCard'
import { SortToggle } from '../UI/SortToggle'
import { PriceLegend } from '../Map/PriceLegend'
import { StationList } from '../UI/StationList'
import { AdBanner } from '../UI/AdBanner'

export function SidePanel({ stations, min, max, showMarkers, visibleCount, unmappedCount }) {
  const { panelOpen, togglePanel, show3D, toggle3D } = useStore()
  const { reload } = useGasPrices()

  return (
    <>
      {/* Collapsed tab */}
      {!panelOpen && (
        <button
          onClick={togglePanel}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-lg p-2 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Open panel"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      )}

      {/* Panel */}
      <aside
        className={`hidden lg:flex flex-col w-[360px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          panelOpen ? 'translate-x-0' : '-translate-x-full absolute left-0 top-0 bottom-0 z-30'
        }`}
      >
        {/* Panel header with collapse button */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Stations
          </span>
          <button
            onClick={togglePanel}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Collapse panel"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Stats */}
            <StatsCard />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <SortToggle />
              <button
                onClick={toggle3D}
                className={`btn-secondary text-sm flex items-center gap-1.5 ${
                  show3D ? 'bg-philly-gold text-slate-900 border-philly-gold' : ''
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                3D
              </button>
              <button
                onClick={reload}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Legend */}
            <PriceLegend min={min} max={max} />

            {/* Station counts */}
            <div className="space-y-0.5 text-xs text-slate-400 text-center">
              {!showMarkers && (
                <div className="text-philly-blue dark:text-blue-400 font-medium">
                  Zoom in to see individual stations
                </div>
              )}
              {showMarkers && visibleCount > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400">
                  {visibleCount} stations in view
                </div>
              )}
              {unmappedCount > 0 && (
                <div className="text-amber-500 dark:text-amber-400">
                  {unmappedCount} hidden until location verified
                </div>
              )}
            </div>
          </div>

          {/* Station list */}
          <StationList stations={stations} />
        </div>

        {/* Ad banner pinned to bottom */}
        <AdBanner />
      </aside>
    </>
  )
}
