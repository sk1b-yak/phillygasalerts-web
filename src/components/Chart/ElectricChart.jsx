import { useEffect, useRef, useState, useCallback } from 'react'
import { formatPrice, formatRelativeTime } from '../../utils/formatters'

// ─── Catmull-Rom → Cubic Bezier smooth path ───────────────────────────────────
function catmullRomToCubic(points) {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const d = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

// ─── Format date label ────────────────────────────────────────────────────────
function fmtLabel(unixSec) {
  const d = new Date(unixSec * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ElectricChart({ candleData = [] }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 600, h: 200 })
  const [hoverIdx, setHoverIdx] = useState(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // ─── Responsive sizing ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect
        if (width > 10 && height > 10) setDims({ w: width, h: height })
      }
    })
    ro.observe(containerRef.current)
    const { clientWidth: w, clientHeight: h } = containerRef.current
    if (w > 10 && h > 10) setDims({ w, h })
    return () => ro.disconnect()
  }, [])

  // ─── Build chart data ────────────────────────────────────────────────────
  const chartPoints = candleData
    .filter(r => r.time && r.close != null)
    .map(r => ({ t: new Date(r.time).getTime() / 1000, v: Number(r.close) }))
    .sort((a, b) => a.t - b.t)

  const PAD = { top: 16, right: 52, bottom: 22, left: 8 }
  const W = dims.w
  const H = dims.h
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const hasData = chartPoints.length >= 2

  // Scale helpers
  const minT = hasData ? chartPoints[0].t : 0
  const maxT = hasData ? chartPoints[chartPoints.length - 1].t : 1
  const values = hasData ? chartPoints.map(p => p.v) : [3.5]
  const minV = Math.min(...values) * 0.999
  const maxV = Math.max(...values) * 1.001
  const rangeV = maxV - minV || 0.01

  const scaleX = t => PAD.left + ((t - minT) / (maxT - minT || 1)) * innerW
  const scaleY = v => PAD.top + (1 - (v - minV) / rangeV) * innerH

  // SVG path points
  const svgPoints = hasData
    ? chartPoints.map(p => ({ x: scaleX(p.t), y: scaleY(p.v) }))
    : []

  const linePath = catmullRomToCubic(svgPoints)

  // Flatline for empty state
  const flatlineY = PAD.top + innerH / 2
  const flatlinePath = `M ${PAD.left} ${flatlineY} L ${PAD.left + innerW} ${flatlineY}`

  // Area fill path (close path at bottom)
  const areaPath = hasData && svgPoints.length >= 2
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${PAD.top + innerH} L ${svgPoints[0].x} ${PAD.top + innerH} Z`
    : null

  // ─── Path length estimation for dash animation ───────────────────────────
  const pathRef = useRef(null)
  const [pathLen, setPathLen] = useState(1000)
  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength()
        if (len > 0) setPathLen(len)
      } catch (_) {}
    }
  }, [linePath, dims])

  // ─── Y-axis price labels ─────────────────────────────────────────────────
  const priceLabels = hasData
    ? [minV + rangeV * 0.1, minV + rangeV * 0.5, minV + rangeV * 0.9]
    : []

  // ─── X-axis date labels ──────────────────────────────────────────────────
  const dateLabels = hasData && chartPoints.length >= 2
    ? [
        { t: chartPoints[0].t, x: PAD.left + 4 },
        { t: chartPoints[Math.floor(chartPoints.length / 2)].t, x: W / 2 },
        { t: chartPoints[chartPoints.length - 1].t, x: W - PAD.right - 4 },
      ]
    : []

  // ─── Current price badge ─────────────────────────────────────────────────
  const lastPrice = hasData ? chartPoints[chartPoints.length - 1].v : null
  const lastPoint = hasData ? svgPoints[svgPoints.length - 1] : null

  // ─── Hover handler ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !hasData) return
    const rect = containerRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    // Find nearest point by X
    let nearest = 0
    let minDist = Infinity
    svgPoints.forEach((p, i) => {
      const d = Math.abs(p.x - mx)
      if (d < minDist) { minDist = d; nearest = i }
    })
    setHoverIdx(nearest)
    setHoverPos({ x: svgPoints[nearest].x, y: svgPoints[nearest].y })
  }, [svgPoints, hasData])

  const handleMouseLeave = () => setHoverIdx(null)

  const hoverData = hoverIdx !== null && chartPoints[hoverIdx]
    ? chartPoints[hoverIdx]
    : null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        @keyframes electric-travel {
          0%   { stroke-dashoffset: var(--pl); opacity: 0; }
          4%   { opacity: 0.9; }
          92%  { opacity: 0.9; }
          100% { stroke-dashoffset: calc(var(--pl) * -0.18); opacity: 0; }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.72; }
          50%       { opacity: 1.0; }
        }
        @keyframes flatline-travel {
          0%   { stroke-dashoffset: 600; opacity: 0; }
          8%   { opacity: 0.8; }
          92%  { opacity: 0.8; }
          100% { stroke-dashoffset: -120; opacity: 0; }
        }
        .electric-base {
          animation: glow-breathe 3s ease-in-out infinite;
        }
        .electric-pulse {
          animation: electric-travel var(--dur, 2.8s) linear infinite;
        }
        .flatline-pulse {
          animation: flatline-travel 2.2s linear infinite;
        }
      `}</style>

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Multi-radius neon glow filter */}
          <filter id="ec-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="7"   result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14"  result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse glow (tighter, brighter) */}
          <filter id="ec-pulse-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3"  result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9"  result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Area fill gradient */}
          <linearGradient id="ec-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.18" />
            <stop offset="60%"  stopColor="#00d4ff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>

          {/* Dot glow */}
          <filter id="ec-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Area fill ── */}
        {areaPath && (
          <path d={areaPath} fill="url(#ec-area-fill)" />
        )}

        {/* ── Flatline (no data) ── */}
        {!hasData && (
          <>
            <path
              d={flatlinePath}
              stroke="#00d4ff"
              strokeWidth="1.5"
              fill="none"
              opacity="0.25"
              filter="url(#ec-glow)"
            />
            <path
              d={flatlinePath}
              stroke="#ffffff"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="80 9999"
              strokeLinecap="round"
              className="flatline-pulse"
              filter="url(#ec-pulse-glow)"
            />
          </>
        )}

        {/* ── Base glow line ── */}
        {hasData && (
          <path
            d={linePath}
            stroke="#00d4ff"
            strokeWidth="1.8"
            fill="none"
            filter="url(#ec-glow)"
            className="electric-base"
          />
        )}

        {/* ── Crisp top line ── */}
        {hasData && (
          <path
            d={linePath}
            stroke="#7ee8ff"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
        )}

        {/* ── Traveling pulse ── */}
        {hasData && (
          <path
            ref={pathRef}
            d={linePath}
            stroke="#ffffff"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${pathLen * 0.18} ${pathLen}`}
            filter="url(#ec-pulse-glow)"
            className="electric-pulse"
            style={{ '--pl': `${pathLen}px`, '--dur': '2.6s' }}
          />
        )}

        {/* ── Latest price dot ── */}
        {hasData && lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3.5"
            fill="#00d4ff"
            filter="url(#ec-dot-glow)"
            opacity="0.95"
          />
        )}

        {/* ── Y-axis price labels ── */}
        {priceLabels.map((v, i) => (
          <text
            key={i}
            x={W - PAD.right + 5}
            y={scaleY(v) + 4}
            fontSize="9"
            fill="rgba(255,255,255,0.28)"
            fontFamily="Inter, system-ui, monospace"
            textAnchor="start"
          >
            {formatPrice(v)}
          </text>
        ))}

        {/* ── X-axis date labels ── */}
        {dateLabels.map((d, i) => (
          <text
            key={i}
            x={d.x}
            y={H - 4}
            fontSize="9"
            fill="rgba(255,255,255,0.20)"
            fontFamily="Inter, system-ui, sans-serif"
            textAnchor={i === 0 ? 'start' : i === dateLabels.length - 1 ? 'end' : 'middle'}
          >
            {fmtLabel(d.t)}
          </text>
        ))}

        {/* ── Hover crosshair ── */}
        {hoverData && (
          <>
            <line
              x1={hoverPos.x}
              x2={hoverPos.x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverPos.x}
              cy={hoverPos.y}
              r="4"
              fill="#00d4ff"
              opacity="0.9"
              filter="url(#ec-dot-glow)"
            />
          </>
        )}
      </svg>

      {/* ── Hover tooltip pill ── */}
      {hoverData && (() => {
        const px = hoverPos.x
        const py = hoverPos.y
        const flipRight = px > W * 0.65
        return (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg px-2.5 py-1
                       bg-black/80 backdrop-blur-sm border border-white/[0.08]
                       text-white text-[11px] font-medium leading-tight"
            style={{
              left: flipRight ? px - 8 : px + 8,
              top: py - 20,
              transform: flipRight ? 'translateX(-100%)' : 'none',
            }}
          >
            <span className="text-[#00d4ff] font-bold">{formatPrice(hoverData.v)}</span>
            <span className="text-white/40 ml-1.5">{formatRelativeTime(new Date(hoverData.t * 1000).toISOString())}</span>
          </div>
        )
      })()}

      {/* ── Current price badge ── */}
      {lastPrice && (
        <div
          className="pointer-events-none absolute top-1 right-1
                     px-2 py-0.5 rounded-md
                     bg-[#00d4ff]/10 border border-[#00d4ff]/25
                     text-[#00d4ff] text-[11px] font-bold tracking-wide"
        >
          {formatPrice(lastPrice)}
        </div>
      )}
    </div>
  )
}
