import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Fuel, Moon, Sun, Monitor, Search, X, ChevronLeft, ChevronRight, RotateCw, Radio, TrendingUp, TrendingDown, Pause, Layers } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { formatPrice } from '../../utils/formatters'
const DeckGLMap = lazy(() => import("../Map/DeckGLMap").then(m => ({ default: m.DeckGLMap })))
import { StationHistoryPopup } from '../Map/StationHistoryPopup'
import { PriceLegend } from '../Map/PriceLegend'
import { StationList } from '../UI/StationList'
import { AdBanner } from '../UI/AdBanner'
import { ErrorBoundary } from '../UI/ErrorBoundary'
import { MobileBottomSheet } from '../UI/MobileBottomSheet'

// ─── Header ───────────────────────────────────────────────────────────────────
function PythViewHeader({ searchQuery, setSearchQuery, theme, toggleTheme, isLive, toggleLive, lastUpdated, layerMode, setLayerMode }) {
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const formatLastUpdated = () => {
    if (!lastUpdated) return ''
    const date = new Date(lastUpdated)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <header className="h-[56px] flex-shrink-0">
      <div className="h-full px-5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#006BB6]/25 border border-[#006BB6]/35 flex items-center justify-center">
            <Fuel className="w-4 h-4 text-[#006BB6]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-none">PHILLYGAS</h1>
            <p className="text-[9px] text-white/35 tracking-[0.2em] uppercase">Live Prices</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations, ZIP codes…"
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/[0.06]
                         text-white placeholder-white/25 text-xs
                         focus:outline-none focus:border-[#006BB6]/50 focus:bg-white/[0.07]
                         transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 text-white/40" />
              </button>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live toggle */}
          <button
            onClick={toggleLive}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
              isLive
                ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
            }`}
            title={lastUpdated ? `Last updated: ${formatLastUpdated()}` : 'Toggle live updates'}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">LIVE</span>
              </>
            ) : (
              <>
                <Pause className="w-2.5 h-2.5 text-white/40" />
                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">PAUSED</span>
              </>
            )}
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06]
                       hover:bg-white/[0.06] flex items-center justify-center transition-all duration-200"
          >
            <ThemeIcon className="w-3.5 h-3.5 text-white/50" />
          </button>

          {/* Layer mode */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            {[
              { mode: 'scatter', icon: Layers,   label: 'Dots' },
              { mode: '3d',      icon: Radio,     label: 'Pulse' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setLayerMode(mode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-200 ${
                  layerMode === mode ? 'bg-[#006BB6] text-white' : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                }`}
                title={`${label} view`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function getScope(zip) {
  const n = parseInt(zip, 10)
  if ((n >= 18000 && n <= 19699) || (n >= 7000 && n <= 8999) ||
      (n >= 19700 && n <= 19999) || (n >= 20600 && n <= 21999)) return 'local'
  return 'national'
}

function StationSidebar({ stations, min, max, isOpen, onToggle }) {
  const [scope, setScope] = useState('local')
  const { reload } = useGasPrices()
  const { getPriceRange } = useStore()
  const priceRange = getPriceRange()

  const scopedStations = stations
    .filter(s => getScope(s.zip_code) === scope)
    .slice(0, 20)

  return (
    <aside
      className={`absolute left-0 z-30 flex flex-col
                  top-[56px] bottom-0 w-[300px]
                  bg-black/60 backdrop-blur-2xl
                  border-r border-white/[0.07]
                  transition-transform duration-300 ease-out
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Sidebar header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Stations</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[10px] font-bold text-white/40">
            {scopedStations.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={reload}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/35 hover:text-white/65 transition-all"
            title="Refresh"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/35 hover:text-white/65 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Low / High */}
      <div className="px-3 py-3 grid grid-cols-2 gap-2 flex-shrink-0">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase">Low</span>
          </div>
          <div className="text-sm font-black text-emerald-400">{formatPrice(priceRange.min)}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-rose-400" />
            <span className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase">High</span>
          </div>
          <div className="text-sm font-black text-rose-400">{formatPrice(priceRange.max)}</div>
        </div>
      </div>

      {/* Local / National toggle */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          {["local", "national"].map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`flex-1 py-1 rounded-md text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-150 ${
                scope === s ? "bg-[#006BB6] text-white" : "text-white/30 hover:text-white/55"
              }`}
            >
              {s === "local" ? "Local" : "National"}
            </button>
          ))}
        </div>
      </div>

      {/* Station list */}
      <div className="flex-1 overflow-y-auto">
        <StationList stations={scopedStations} />
      </div>

      <AdBanner />
    </aside>
  )
}

function CollapsedSidebarTab({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/3 -translate-y-1/2 z-29
                 w-7 h-20 rounded-r-xl
                 bg-black/60 backdrop-blur-2xl border border-l-0 border-white/[0.07]
                 flex items-center justify-center
                 hover:bg-black/80 transition-all duration-200 group"
    >
      <ChevronRight className="w-3.5 h-3.5 text-white/35 group-hover:text-white/65 transition-colors" />
    </button>
  )
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function PythViewLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { theme, toggleTheme, searchQuery, setSearchQuery } = useStore()
  const { getFilteredStations, getPriceRange, isLive, toggleLive, lastUpdated, refreshData } = useStore()
  const layerMode = useStore(s => s.layerMode)
  const setLayerMode = useStore(s => s.setLayerMode)
  const isNavMode = useStore(s => !!(s.directionsRoute || s.directionsLoading))

  const filteredStations = getFilteredStations()
  const { min, max } = getPriceRange()

  // Auto-collapse sidebar when directions are active (more map real estate)
  useEffect(() => {
    if (isNavMode) setSidebarOpen(false)
  }, [isNavMode])

  // Auto-refresh when live
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => refreshData(), 30000)
    return () => clearInterval(interval)
  }, [isLive, refreshData])

  // Time-based map theme: light 6am-8pm, dark otherwise
  const { setTheme } = useStore()
  useEffect(() => {
    function applyTimeTheme() {
      const h = new Date().getHours()
      setTheme(h >= 6 && h < 20 ? 'light' : 'dark')
    }
    applyTimeTheme()
    const timer = setInterval(applyTimeTheme, 60 * 1000)
    return () => clearInterval(timer)
  }, [setTheme])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0e1a]">
      {/* Layer 0: Map fills everything */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="w-full h-full bg-[#0a0e1a] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#006BB6]/30 border-t-[#006BB6] rounded-full animate-spin" />
                <span className="text-xs text-white/30 font-medium tracking-widest uppercase">Loading Map</span>
              </div>
            </div>
          }>
            <DeckGLMap />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Layer 1: Header glass bar */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-white/[0.07]">
        <PythViewHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          toggleTheme={toggleTheme}
          isLive={isLive}
          toggleLive={toggleLive}
          lastUpdated={lastUpdated}
          layerMode={layerMode}
          setLayerMode={setLayerMode}
        />
      </div>

      {/* Layer 2: Left glass sidebar */}
      <StationSidebar
        stations={filteredStations}
        min={min}
        max={max}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      {!sidebarOpen && (
        <CollapsedSidebarTab onClick={() => setSidebarOpen(true)} />
      )}

      {/* Layer 3: Station history popup */}
      <StationHistoryPopup />

      {/* Mobile bottom sheet (lg:hidden inside) */}
      <MobileBottomSheet stations={filteredStations} />
    </div>
  )
}

export default PythViewLayout
