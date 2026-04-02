import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { X, Navigation, ArrowLeft, ArrowUp, CornerUpLeft, CornerUpRight, RotateCw, GitMerge, Car, MapPin } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { formatRelativeTime, formatPrice } from '../../utils/formatters'
import { getLogo } from '../Logos/registry'

// ─── Directions helpers ────────────────────────────────────────────────────────
const fmtDist = m => m >= 1609 ? `${(m / 1609).toFixed(1)} mi` : `${Math.round(m * 3.281)} ft`
const fmtTime = s => s >= 3600
  ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  : `${Math.round(s / 60)} min`

function stepIcon(type, modifier = '') {
  if (type === 'arrive')                           return MapPin
  if (type === 'depart')                           return Navigation
  if (type === 'roundabout' || type === 'rotary')  return RotateCw
  if (type === 'fork' || type === 'merge')         return GitMerge
  if (modifier.includes('left'))                   return CornerUpLeft
  if (modifier.includes('right'))                  return CornerUpRight
  return ArrowUp
}

// ─── Directions ad — rotates through Right-Panel-A / Right-Panel-B ────────────
const DIRECTIONS_AD_SLOTS = ['5068701918', '8900135717']
let _dirAdCursor = 0

function DirectionsAd() {
  const slot = DIRECTIONS_AD_SLOTS[_dirAdCursor++ % DIRECTIONS_AD_SLOTS.length]
  const adRef = useRef(null)
  const pushed = useRef(false)
  useEffect(() => {
    if (!adRef.current || pushed.current) return
    pushed.current = true
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch (_) {}
  }, [])
  return (
    <div className="rounded-lg overflow-hidden my-1">
      <p className="text-[8px] text-white/20 uppercase tracking-widest mb-0.5 px-0.5">Sponsored</p>
      <ins ref={adRef} className="adsbygoogle"
           style={{ display: 'inline-block', width: 300, height: 250 }}
           data-ad-client="ca-pub-5969510122602447"
           data-ad-slot={slot} />
    </div>
  )
}

function smoothPath(pts) {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x} ${pts[0].y}` : ''
  const d = [`M ${pts[0].x} ${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

function bucketByDay(pts) {
  const DAY = 86400000
  const bmap = {}
  pts.forEach(p => {
    const bk = Math.floor(p.t / DAY) * DAY
    if (!bmap[bk]) bmap[bk] = { sum: 0, n: 0 }
    bmap[bk].sum += p.v
    bmap[bk].n++
  })
  return Object.entries(bmap)
    .map(([bk, { sum, n }]) => ({ t: parseInt(bk) + DAY / 2, v: sum / n }))
    .sort((a, b) => a.t - b.t)
}

function applyEMA(pts, alpha = 0.3) {
  if (!pts.length) return pts
  const out = [{ ...pts[0] }]
  for (let i = 1; i < pts.length; i++)
    out.push({ t: pts[i].t, v: alpha * pts[i].v + (1 - alpha) * out[i - 1].v })
  return out
}

function MiniSparkline({ records, regionRecords = [], W = 240, H = 110 }) {
  const svgRef = useRef(null)
  const [pathLen, setPathLen] = useState(400)
  const [hover, setHover] = useState(null)
  const pathRef = useRef(null)

  const PAD = { top: 18, right: 12, bottom: 30, left: 12 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  const pts = records
    .filter(r => r.price_regular > 0 && r.time)
    .map(r => ({ t: new Date(r.time).getTime(), v: r.price_regular }))
    .sort((a, b) => a.t - b.t)

  const DAY = 86400000
  const regionPts = useMemo(() => {
    if (!regionRecords.length) return []
    const bmap = {}
    regionRecords.forEach(r => {
      if (!r.time || !r.price_regular) return
      const bk = Math.floor(new Date(r.time).getTime() / DAY) * DAY
      if (!bmap[bk]) bmap[bk] = { sum: 0, n: 0 }
      bmap[bk].sum += r.price_regular
      bmap[bk].n++
    })
    return Object.entries(bmap)
      .map(([bk, { sum, n }]) => ({ t: parseInt(bk) + DAY / 2, v: sum / n }))
      .sort((a, b) => a.t - b.t)
  }, [regionRecords])

  const drawPts = applyEMA(bucketByDay(pts), 0.3)
  const drawRegionPts = applyEMA(regionPts, 0.3)

  if (drawPts.length < 2) {
    return (
      <div className="flex items-center justify-center text-white/20 text-xs" style={{ width: W, height: H }}>
        Not enough data
      </div>
    )
  }

  const allT = [...drawPts.map(p => p.t), ...drawRegionPts.map(p => p.t)]
  const allV = [...drawPts.map(p => p.v), ...drawRegionPts.map(p => p.v)]
  const minT = Math.min(...allT), maxT = Math.max(...allT)
  const rawMinV = Math.min(...allV), rawMaxV = Math.max(...allV)
  const vPad = (rawMaxV - rawMinV) * 0.10 || 0.05
  const minV = rawMinV - vPad, maxV = rawMaxV + vPad
  const rV = maxV - minV || 0.01

  const sx = t => PAD.left + ((t - minT) / (maxT - minT || 1)) * iW
  const sy = v => PAD.top + (1 - (v - minV) / rV) * iH

  const svgPts = drawPts.map(p => ({ x: sx(p.t), y: sy(p.v) }))
  const line = smoothPath(svgPts)
  const area = `${line} L ${svgPts[svgPts.length-1].x} ${PAD.top+iH} L ${svgPts[0].x} ${PAD.top+iH} Z`

  const regionSvgPts = drawRegionPts.map(p => ({ x: sx(p.t), y: sy(p.v) }))
  const regionLine = regionSvgPts.length >= 2 ? smoothPath(regionSvgPts) : null
  const regionArea = regionLine
    ? `${regionLine} L ${regionSvgPts[regionSvgPts.length-1].x} ${PAD.top+iH} L ${regionSvgPts[0].x} ${PAD.top+iH} Z`
    : null

  const last = svgPts[svgPts.length - 1]

  useEffect(() => {
    if (pathRef.current) {
      try { const l = pathRef.current.getTotalLength(); if (l > 0) setPathLen(l) } catch (_) {}
    }
  }, [line])


  const handleMove = useCallback((e) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (W / rect.width)
    let best = 0, bd = Infinity
    svgPts.forEach((p, i) => { const d = Math.abs(p.x - mx); if (d < bd) { bd = d; best = i } })
    setHover({ idx: best, x: svgPts[best].x, y: svgPts[best].y })
  }, [svgPts, W])

  const hd = hover !== null && drawPts.length
    ? pts.reduce((best, p) =>
        Math.abs(p.t - drawPts[hover.idx].t) < Math.abs(best.t - drawPts[hover.idx].t) ? p : best
      , pts[0])
    : null
  const fmtDate = ms => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const fontSize = H > 160 ? 10 : 9
  const legendFontSize = H > 160 ? 9 : 7.5

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <style>{`
        @keyframes spark-travel {
          0%   { stroke-dashoffset: var(--sl); opacity: 0; }
          8%   { opacity: 0.9; } 92% { opacity: 0.9; }
          100% { stroke-dashoffset: calc(var(--sl) * -0.15); opacity: 0; }
        }
        @keyframes spark-breathe { 0%,100% { opacity: 0.70; } 50% { opacity: 1.0; } }
        .spark-base  { animation: spark-breathe 3s ease-in-out infinite; }
        .spark-pulse { animation: spark-travel 2.4s linear infinite; }
      `}</style>
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
           onMouseMove={handleMove} onMouseLeave={() => setHover(null)}
           style={{ cursor: 'crosshair', display: 'block' }}>
        <defs>
          <filter id="sp-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b2"/>
            <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="sp-pulse-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b1"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b2"/>
            <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="sp-dot" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="sp-lbl" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          <linearGradient id="sp-red-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c0392b" stopOpacity="0.32"/>
            <stop offset="55%"  stopColor="#c0392b" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#c0392b" stopOpacity="0.02"/>
          </linearGradient>
        </defs>

        {regionArea && (
          <path d={regionArea} fill="url(#sp-red-fill)" />
        )}
        {regionLine && (
          <path d={regionLine} stroke="#c0392b" strokeWidth="0.9" fill="none" opacity="0.35" />
        )}

        <path d={line} stroke="#00d4ff" strokeWidth="1.5" fill="none"
              filter="url(#sp-glow)" className="spark-base" />
        <path d={line} stroke="#7ee8ff" strokeWidth="0.9" fill="none" opacity="0.55" />
        <path ref={pathRef} d={line} stroke="#ffffff" strokeWidth="2.2" fill="none"
              strokeLinecap="round" strokeDasharray={`${pathLen * 0.15} ${pathLen}`}
              filter="url(#sp-pulse-glow)" className="spark-pulse"
              style={{ '--sl': `${pathLen}px` }} />

        <circle cx={last.x} cy={last.y} r="3" fill="#00d4ff" filter="url(#sp-dot)" opacity="0.95" />

        {/* High price — cyan glow */}
        <text x={PAD.left + 2} y={PAD.top - 4}
              fontSize={fontSize} fontWeight="700" fill="#00d4ff"
              fontFamily="Inter,monospace" textAnchor="start"
              filter="url(#sp-lbl)" opacity="0.92">{formatPrice(rawMaxV)}</text>

        {/* Low price — red glow */}
        <text x={PAD.left + 2} y={PAD.top + iH + 11}
              fontSize={fontSize} fontWeight="700" fill="#ff9999"
              fontFamily="Inter,monospace" textAnchor="start"
              filter="url(#sp-lbl)" opacity="0.85">{formatPrice(rawMinV)}</text>

        {/* Legend */}
        <circle cx={PAD.left + 4} cy={H - 9} r="2.5" fill="#00d4ff" opacity="0.8" />
        <text x={PAD.left + 11} y={H - 6} fontSize={legendFontSize} fill="rgba(255,255,255,0.38)"
              fontFamily="Inter,sans-serif">This station</text>
        {regionLine && <>
          <rect x={PAD.left + 81} y={H - 12} width="8" height="6" rx="1.5"
                fill="#c0392b" opacity="0.55" />
          <text x={PAD.left + 92} y={H - 6} fontSize={legendFontSize} fill="rgba(255,255,255,0.38)"
                fontFamily="Inter,sans-serif">Region avg</text>
        </>}

        {/* Date range centered */}
        <text x={W / 2} y={H - 6} fontSize={legendFontSize - 0.5} fill="rgba(255,255,255,0.16)"
              fontFamily="Inter,sans-serif" textAnchor="middle">
          {fmtDate(minT)} – {fmtDate(maxT)}
        </text>

        {hover && <>
          <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={PAD.top+iH}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 3"/>
          <circle cx={hover.x} cy={hover.y} r="3.5" fill="#00d4ff"
                  filter="url(#sp-dot)" opacity="0.95"/>
        </>}
      </svg>

      {hd && hover && (
        <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md px-2 py-0.5
                       bg-black/85 border border-white/[0.07] text-[10px] leading-tight"
             style={{
               left: hover.x > W * 0.6 ? hover.x - 8 : hover.x + 8,
               top: Math.max(2, hover.y - 20),
               transform: hover.x > W * 0.6 ? 'translateX(-100%)' : 'none',
             }}>
          <span className="text-[#00d4ff] font-bold">{formatPrice(hd.v)}</span>
          <span className="text-white/40 ml-1">{formatRelativeTime(new Date(hd.t).toISOString())}</span>
        </div>
      )}
    </div>
  )
}

// ─── Resize grip icon ─────────────────────────────────────────────────────────
function ResizeGrip() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
      <circle cx="10" cy="10" r="1.2" fill="#ffffff"/>
      <circle cx="6"  cy="10" r="1.2" fill="#ffffff"/>
      <circle cx="10" cy="6"  r="1.2" fill="#ffffff"/>
      <circle cx="2"  cy="10" r="1.2" fill="#ffffff"/>
      <circle cx="6"  cy="6"  r="1.2" fill="#ffffff"/>
      <circle cx="10" cy="2"  r="1.2" fill="#ffffff"/>
    </svg>
  )
}

// ─── Main popup component ──────────────────────────────────────────────────────
export function StationHistoryPopup() {
  const selectedStation = useStore(s => s.selectedStation)
  const setSelectedStation = useStore(s => s.setSelectedStation)

  // Directions state
  const directionsRoute   = useStore(s => s.directionsRoute)
  const directionsOrigin  = useStore(s => s.directionsOrigin)
  const directionsLoading = useStore(s => s.directionsLoading)
  const directionsError   = useStore(s => s.directionsError)
  const setDirectionsRoute  = useStore(s => s.setDirectionsRoute)
  const setDirectionsLoading = useStore(s => s.setDirectionsLoading)
  const setDirectionsError  = useStore(s => s.setDirectionsError)
  const clearDirections   = useStore(s => s.clearDirections)
  const isNavMode = !!(directionsRoute || directionsLoading || directionsError)
  const BrandLogo = selectedStation ? getLogo(selectedStation.station_name, selectedStation.brand) : null

  const [records, setRecords] = useState([])
  const [regionRecords, setRegionRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Resizable popup state — starts compact
  const MIN_W = 284, MIN_H = 200
  const MAX_W = 600, MAX_H = 480
  const [popupW, setPopupW] = useState(MIN_W)
  const [popupH, setPopupH] = useState(MIN_H)
  const isResizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: MIN_W, h: MIN_H })

  const handleResizeDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: popupW, h: popupH }

    const onMove = (e) => {
      if (!isResizing.current) return
      // popup anchored right: drag left = wider, drag down = taller
      const dx = resizeStart.current.x - e.clientX
      const dy = e.clientY - resizeStart.current.y
      setPopupW(Math.max(MIN_W, Math.min(MAX_W, resizeStart.current.w + dx)))
      setPopupH(Math.max(MIN_H, Math.min(MAX_H, resizeStart.current.h + dy)))
    }
    const onUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [popupW, popupH])

  // Directions handler
  const handleDirections = useCallback(() => {
    if (!selectedStation?.lat || !selectedStation?.lng) return
    setDirectionsLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: uLat, longitude: uLng } }) => {
        const { lat: dLat, lng: dLng } = selectedStation
        fetch(
          `https://router.project-osrm.org/route/v1/driving/` +
          `${uLng},${uLat};${dLng},${dLat}` +
          `?steps=true&geometries=geojson&overview=full&annotations=false`
        )
          .then(r => r.json())
          .then(data => {
            if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found')
            setDirectionsRoute(data.routes[0], { lat: uLat, lng: uLng })
          })
          .catch(e => setDirectionsError(e.message || 'Route unavailable'))
      },
      () => setDirectionsError('Location access denied — please allow location in your browser')
    )
  }, [selectedStation, setDirectionsLoading, setDirectionsRoute, setDirectionsError])

  // Chart dimensions derived from popup size
  const CHART_W = popupW - 24   // px-3 (12px) each side
  const HEADER_H = 88           // header block approx
  const FOOTER_H = 28
  const CHART_H = Math.max(110, popupH - HEADER_H - FOOTER_H)

  // One-time regional fetch
  useEffect(() => {
    if (!selectedStation) return;
    fetch('/api/history?limit=2000')
      .then(r => r.json())
      .then(data => setRegionRecords(Array.isArray(data) ? data.filter(r => r.price_regular > 0) : []))
      .catch(() => {})
  }, [selectedStation?.station_name])

  // Per-station fetch
  useEffect(() => {
    if (!selectedStation) { setRecords([]); setError(false); return }
    setLoading(true)
    fetch(`/api/history?station_name=${encodeURIComponent(selectedStation.station_name)}&limit=100`)
      .then(r => r.json())
      .then(data => {
        const sorted = Array.isArray(data)
          ? data.filter(r => r.price_regular > 0).sort((a, b) => a.time.localeCompare(b.time))
          : []
        setRecords(sorted)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [selectedStation?.station_name])

  // Reset size + clear directions when station changes
  useEffect(() => {
    setPopupW(MIN_W)
    setPopupH(MIN_H)
    clearDirections()
  }, [selectedStation?.station_name])

  if (!selectedStation) return null

  const currentPrice = parseFloat(selectedStation.price_regular || 0)

  return (
    <div
      className="absolute top-[64px] right-4 z-50
                  bg-black/65 backdrop-blur-2xl border border-white/[0.09]
                  rounded-2xl shadow-2xl overflow-hidden select-none"
      style={{ width: popupW }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3.5 border-b border-white/[0.06]">
        <div className="flex items-start gap-2 flex-1 min-w-0 pr-2">
          {BrandLogo && <div className="flex-shrink-0 mt-0.5"><BrandLogo size={28} /></div>}
          <div className="min-w-0">
            <div className="font-semibold text-white text-[13px] leading-tight truncate">
              {selectedStation.station_name}
            </div>
          <div className="text-white/40 text-[10px] mt-0.5 truncate">
            {selectedStation.address}
          </div>
          <div className="text-[#00d4ff] font-bold text-[18px] mt-1 leading-none">
            {formatPrice(currentPrice)}
          </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
          {isNavMode ? (
            <button onClick={clearDirections}
                    className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors p-1 text-[10px]">
              <ArrowLeft size={11} />
              <span>Back</span>
            </button>
          ) : (
            <button onClick={handleDirections} title="Take me there"
                    className="text-white/35 hover:text-[#006BB6] transition-colors p-1">
              <Navigation size={14} />
            </button>
          )}
          <button onClick={() => { clearDirections(); setSelectedStation(null) }}
                  className="text-white/35 hover:text-white/70 transition-colors p-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Chart body OR directions */}
      <div className="px-3 pt-3 pb-1">
        {isNavMode ? (
          /* ── Directions view ── */
          <div>
            {directionsLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <div className="text-[#006BB6] text-[10px] font-black tracking-[0.3em] uppercase animate-pulse">
                  Calculating Route
                </div>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#006BB6]/60"
                         style={{ animation: `pulse 1s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            {directionsError && (
              <div className="py-4 text-center">
                <p className="text-rose-400/80 text-[11px] mb-2">{directionsError}</p>
                <button onClick={handleDirections}
                        className="text-[10px] text-white/40 hover:text-white/70 underline">
                  Try again
                </button>
              </div>
            )}
            {directionsRoute && (
              <div className="flex flex-col gap-2">
                {/* Route summary */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Car className="w-4 h-4 text-[#006BB6] flex-shrink-0" />
                  <div>
                    <div className="text-white font-bold text-[13px]">{fmtTime(directionsRoute.duration)}</div>
                    <div className="text-white/40 text-[10px]">{fmtDist(directionsRoute.distance)}</div>
                  </div>
                </div>

                {/* Ad — rotates slot each open */}
                <DirectionsAd />

                {/* Turn-by-turn steps */}
                <div className="flex flex-col gap-0 max-h-[280px] overflow-y-auto"
                     style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {directionsRoute.legs[0].steps.map((step, i) => {
                    const Icon = stepIcon(step.maneuver.type, step.maneuver.modifier || '')
                    const label = step.maneuver.type === 'arrive'
                      ? `Arrive at ${selectedStation.station_name}`
                      : step.name || step.maneuver.type
                    return (
                      <div key={i}
                           className="flex items-start gap-2.5 py-1.5 px-1 border-b border-white/[0.04] last:border-0">
                        <Icon className="w-3.5 h-3.5 text-[#006BB6] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white/80 text-[11px] leading-snug">{label}</div>
                          {step.distance > 50 && (
                            <div className="text-white/30 text-[10px]">{fmtDist(step.distance)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Sparkline view ── */
          <div>
            {loading && (
              <div className="flex items-center justify-center text-white/30 text-xs"
                   style={{ height: CHART_H }}>Loading…</div>
            )}
            {!loading && error && (
              <div className="flex items-center justify-center text-white/20 text-xs"
                   style={{ height: CHART_H }}>Could not load history</div>
            )}
            {!loading && !error && records.length >= 2 && (
              <MiniSparkline records={records} regionRecords={regionRecords}
                             W={CHART_W} H={CHART_H} />
            )}
            {!loading && !error && records.length < 2 && (
              <div className="flex items-center justify-center text-white/20 text-xs"
                   style={{ height: CHART_H }}>No history available</div>
            )}
          </div>
        )}
      </div>

      {/* Footer + resize grip — grip bottom-left, expands into map */}
      <div className="flex items-center gap-2 px-2 pb-2">
        <div
          onMouseDown={handleResizeDown}
          className="cursor-sw-resize p-1 -ml-1 -mb-1 flex items-end justify-start flex-shrink-0"
          title="Drag to expand"
          style={{ touchAction: 'none' }}
        >
          <ResizeGrip />
        </div>
        <div className="text-[10px] text-white/25">
          {records.length} record{records.length !== 1 ? 's' : ''} &middot; newest{' '}
          {records.length > 0 ? formatRelativeTime(records[records.length - 1].time) : ''}
        </div>
      </div>
    </div>
  )
}
