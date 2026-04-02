import { useRef, useEffect, useCallback } from 'react'
import { Search, X, Box, RotateCw, ChevronUp } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { StatsBarCondensed } from '../UI/StatsCard'
import { SortToggle } from '../UI/SortToggle'
import { StationList } from '../UI/StationList'
import { AdBanner } from '../UI/AdBanner'

const POSITIONS = {
  peek: 60,   // px from bottom
  half: 40,   // % of viewport
  full: 85,   // % of viewport
}

export function MobileBottomSheet({ stations }) {
  const sheetRef = useRef(null)
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false })

  const {
    bottomSheetPosition,
    setBottomSheetPosition,
    searchQuery,
    setSearchQuery,
    show3D,
    toggle3D,
  } = useStore()
  const { reload } = useGasPrices()

  const getHeight = useCallback((pos) => {
    if (pos === 'peek') return `${POSITIONS.peek}px`
    if (pos === 'half') return `${POSITIONS.half}vh`
    return `${POSITIONS.full}vh`
  }, [])

  // Collapse sheet when user taps the map
  useEffect(() => {
    const handleMapClick = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        if (bottomSheetPosition !== 'peek') {
          setBottomSheetPosition('peek')
        }
      }
    }
    document.addEventListener('mousedown', handleMapClick)
    return () => document.removeEventListener('mousedown', handleMapClick)
  }, [bottomSheetPosition, setBottomSheetPosition])

  // Touch drag handling
  const onTouchStart = (e) => {
    const touch = e.touches[0]
    dragRef.current = {
      startY: touch.clientY,
      startHeight: sheetRef.current?.getBoundingClientRect().height || 0,
      dragging: true,
    }
  }

  const onTouchMove = (e) => {
    if (!dragRef.current.dragging || !sheetRef.current) return
    const touch = e.touches[0]
    const delta = dragRef.current.startY - touch.clientY
    const newHeight = Math.max(60, Math.min(window.innerHeight * 0.9, dragRef.current.startHeight + delta))
    sheetRef.current.style.height = `${newHeight}px`
    sheetRef.current.style.transition = 'none'
  }

  const onTouchEnd = () => {
    if (!dragRef.current.dragging || !sheetRef.current) return
    dragRef.current.dragging = false
    sheetRef.current.style.transition = ''

    const height = sheetRef.current.getBoundingClientRect().height
    const vh = window.innerHeight

    // Snap to nearest position
    if (height < vh * 0.15) {
      setBottomSheetPosition('peek')
    } else if (height < vh * 0.6) {
      setBottomSheetPosition('half')
    } else {
      setBottomSheetPosition('full')
    }

    // Reset inline style so CSS class takes over
    sheetRef.current.style.height = ''
  }

  const cyclePosition = () => {
    const order = ['peek', 'half', 'full']
    const idx = order.indexOf(bottomSheetPosition)
    setBottomSheetPosition(order[(idx + 1) % order.length])
  }

  return (
    <div
      ref={sheetRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-slate-800 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-[height] duration-300 ease-out flex flex-col"
      style={{ height: getHeight(bottomSheetPosition) }}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={cyclePosition}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Peek bar: always visible stats */}
        <div className="px-4 py-1.5 flex items-center justify-between">
          <StatsBarCondensed />
          <ChevronUp
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              bottomSheetPosition === 'full' ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Half content: search + controls */}
      {bottomSheetPosition !== 'peek' && (
        <div className="flex-shrink-0 px-4 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ZIP, station, or address..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-philly-blue/30 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Control row */}
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
            <button onClick={reload} className="btn-secondary text-sm flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Full content: scrollable station list */}
      {bottomSheetPosition === 'full' && (
        <div className="flex-1 overflow-y-auto border-t border-slate-100 dark:border-slate-700/50">
          <StationList stations={stations} compact />
          <AdBanner className="mt-auto" />
        </div>
      )}
    </div>
  )
}
