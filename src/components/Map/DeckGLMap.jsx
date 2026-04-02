import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import DeckGL from '@deck.gl/react'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer, ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { FlyToInterpolator } from '@deck.gl/core'

import { useStore } from '../../stores/useStore'
import { useGasPrices } from '../../hooks/useGasPrices'
import { getPriceColor } from '../../utils/colors'
import { formatPrice, formatRelativeTime } from '../../utils/formatters'
import { getTimeScheme, getSchemeByName } from '../../utils/timeScheme'
import { PriceLegend } from './PriceLegend'
import { LoadingSpinner } from '../UI/LoadingSpinner'
import { MobileBottomSheet } from '../UI/MobileBottomSheet'

// ─── Constants ────────────────────────────────────────────────────────────────
const PHILLY_CENTER = { longitude: -75.1652, latitude: 39.9526, zoom: 11, pitch: 0, bearing: 0 }
const LABEL_SHOW_ZOOM = 13

const CARTO = {
  dark:  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  light: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
}

const HEATMAP_COLORS = [
  [0, 107, 182, 220],   // philly blue  (cheap)
  [34, 197, 94, 220],   // green
  [252, 209, 22, 220],  // gold
  [249, 115, 22, 220],  // orange
  [198, 30, 46, 220],   // crimson      (expensive)
  [139, 0, 20, 230],    // dark crimson (very expensive)
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha = 220) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16), alpha] : [100, 100, 100, alpha]
}

// ─── Station freshness opacity ─────────────────────────────────────────────────
function getStalenessAlpha(station, freshestMs) {
  const t = station.price_updated_at || station.time
  if (!t) return 80
  const ageHours = (freshestMs - new Date(t).getTime()) / 3_600_000
  if (ageHours < 12)  return 220   // fresh
  if (ageHours < 24)  return 160   // ~1 scrape behind
  if (ageHours < 48)  return 90    // 2 scrapes behind
  return 45                         // very stale — ghost
}

// ─── Pulse animation hook ──────────────────────────────────────────────────────
function usePulse(active) {
  const [phase, setPhase] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setPhase(0)
      return
    }
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts
      // Slow breathing: 3-second full cycle
      const elapsed = (ts - startRef.current) / 3000
      setPhase(Math.sin(elapsed * Math.PI * 2) * 0.5 + 0.5) // 0 -> 1 -> 0
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active])

  return phase // 0 to 1
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DeckGLMap() {
  const {
    viewState: storeViewState,
    setViewState,
    show3D,
    theme,
    schemeOverride,
    setSchemeOverride,
    isLoading,
    error,
    getFilteredStations,
    getPriceRange,
    selectedStation,
    setSelectedStation,
    selectedGasType,
    directionsRoute,
    directionsOrigin,
  } = useStore()

  const { reload } = useGasPrices()

  // Pulse animation (active when show3D / "Pulse" mode is on)
  const pulsePhase = usePulse(show3D)

  // Local deck.gl controlled viewState — animated transitions on flyTo
  const [deckViewState, setDeckViewState] = useState(storeViewState || PHILLY_CENTER)

  // Route draw animation state
  const [routeDrawn, setRouteDrawn] = useState(0)

  useEffect(() => {
    if (!directionsRoute?.geometry?.coordinates) { setRouteDrawn(0); return }
    const total = directionsRoute.geometry.coordinates.length
    let n = 0
    const step = Math.max(1, Math.ceil(total / 90))
    const id = setInterval(() => {
      n = Math.min(n + step, total)
      setRouteDrawn(n)
      if (n >= total) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [directionsRoute])

  // Fit map to route bounds when route arrives
  useEffect(() => {
    if (!directionsRoute?.geometry?.coordinates) return
    const coords = directionsRoute.geometry.coordinates
    const lngs = coords.map(c => c[0])
    const lats  = coords.map(c => c[1])
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats),  maxLat = Math.max(...lats)
    const midLng = (minLng + maxLng) / 2
    const midLat = (minLat + maxLat) / 2
    const span = Math.max(maxLng - minLng, (maxLat - minLat) * 1.4)
    const zoom = Math.max(8, Math.min(13, Math.floor(Math.log2(1.1 / span)) + 8))
    setDeckViewState({
      longitude: midLng,
      latitude: midLat,
      zoom,
      pitch: 30,
      bearing: 0,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.6, curve: 1.3 }),
    })
  }, [directionsRoute])

  // Sync Zustand viewState into deck.gl with fly animation
  useEffect(() => {
    if (!storeViewState) return
    setDeckViewState(prev => ({
      ...storeViewState,
      transitionDuration:
        prev.longitude !== storeViewState.longitude || prev.latitude !== storeViewState.latitude
          ? 800
          : 0,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
    }))
  }, [storeViewState?.longitude, storeViewState?.latitude, storeViewState?.zoom])

  // Gentle tilt when pulse mode is on (subtle perspective, not full 3D)
  useEffect(() => {
    setDeckViewState(prev => ({
      ...prev,
      pitch: show3D ? 20 : 0,
      bearing: show3D ? -8 : 0,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator({ speed: 1 }),
    }))
  }, [show3D])

  const filteredStations = getFilteredStations()
  const mappableStations = useMemo(
    () => filteredStations.filter(s => s.has_reliable_location && s.lat != null && s.lng != null),
    [filteredStations]
  )

  // Intro cinematic fly-to cheapest station — fires once after first data load
  const introFired = useRef(false)
  useEffect(() => {
    if (introFired.current || isLoading || !mappableStations.length) return
    introFired.current = true

    const cheapest = [...mappableStations]
      .filter(s => parseFloat(s.price_regular) > 0)
      .sort((a, b) => parseFloat(a.price_regular) - parseFloat(b.price_regular))[0]
    if (!cheapest) return

    setDeckViewState({
      longitude: -75.1652, latitude: 39.9526,
      zoom: 8.5, pitch: 0, bearing: 0,
      transitionDuration: 0,
    })
    setTimeout(() => {
      setDeckViewState({
        longitude: cheapest.lng, latitude: cheapest.lat,
        zoom: 15, pitch: 0, bearing: 0,
        transitionDuration: 2400,
        transitionInterpolator: new FlyToInterpolator({ speed: 2.8, curve: 1.6 }),
      })
    }, 180)
  }, [isLoading, mappableStations.length])

  const isDark = theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const freshestMs = useMemo(() =>
    mappableStations.reduce((mx, s) => {
      const t = s.price_updated_at || s.time
      return t ? Math.max(mx, new Date(t).getTime()) : mx
    }, 0),
  [mappableStations])
  const { min: priceMin, max: priceMax } = getPriceRange()

  const priceKey = selectedGasType ? `price_${selectedGasType}` : 'price_regular'
  const zoom = deckViewState?.zoom ?? PHILLY_CENTER.zoom
  const showLabels = zoom >= LABEL_SHOW_ZOOM

  const getPriceRgba = useCallback((station, _alpha) => {
    const price = parseFloat(station[priceKey] || station.price_regular || 0)
    const alpha = _alpha !== undefined ? _alpha : getStalenessAlpha(station, freshestMs)
    return hexToRgba(getPriceColor(price, priceMin, priceMax), alpha)
  }, [priceKey, priceMin, priceMax, freshestMs])

  // ─── Layers ───────────────────────────────────────────────────────────────
  const layers = useMemo(() => {
    const list = []

    // 1. Basemap tiles
    list.push(new TileLayer({
      id: 'carto-basemap',
      data: isDark ? CARTO.dark : CARTO.light,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props) => {
        const { boundingBox } = props.tile
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
        })
      },
    }))

    if (!mappableStations.length) return list

    if (!show3D) {
      // ── Standard mode: Heatmap + dots + labels ──

      // 2. Heatmap (always visible)
      list.push(new HeatmapLayer({
        id: 'price-heatmap',
        data: mappableStations,
        getPosition: d => [d.lng, d.lat],
        getWeight: d => parseFloat(d[priceKey] || d.price_regular || 0) || 1,
        aggregation: 'MEAN',
        colorRange: HEATMAP_COLORS,
        radiusPixels: 50,
        intensity: 1,
        threshold: 0.03,
        opacity: 0.7,
        updateTriggers: { getWeight: [priceKey] },
      }))

      // 3. Station dots when zoomed in
      if (showLabels) {
        list.push(new ScatterplotLayer({
          id: 'station-dots',
          data: mappableStations,
          getPosition: d => [d.lng, d.lat],
          getRadius: d => selectedStation?.address === d.address ? 65 : 42,
          getFillColor: d => getPriceRgba(d),
          getLineColor: isDark ? [255, 255, 255, 160] : [0, 0, 0, 100],
          lineWidthMinPixels: 2,
          radiusMinPixels: 5,
          radiusMaxPixels: 18,
          pickable: true,
          onClick: ({ object }) => { if (object) setSelectedStation(object) },
          updateTriggers: {
            getRadius: [selectedStation?.address],
            getFillColor: [priceKey, priceMin, priceMax],
          },
        }))

        // 4. Price labels
        list.push(new TextLayer({
          id: 'price-labels',
          data: mappableStations,
          getPosition: d => [d.lng, d.lat],
          getText: d => formatPrice(parseFloat(d[priceKey] || d.price_regular || 0)),
          getColor: d => getPriceRgba(d, 255).slice(0, 3).concat([255]),
          getSize: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '700',
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          getPixelOffset: [0, -16],
          background: true,
          getBackgroundColor: isDark ? [15, 23, 42, 210] : [255, 255, 255, 210],
          getBorderColor: isDark ? [255, 255, 255, 35] : [0, 0, 0, 25],
          getBorderWidth: 1,
          backgroundPadding: [4, 2, 4, 2],
          pickable: false,
          updateTriggers: {
            getText: [priceKey],
            getColor: [priceKey, priceMin, priceMax],
            getBackgroundColor: [isDark],
          },
        }))
      }
    }

    if (show3D) {
      // ── Pulse mode: breathing animated dots ──

      // Pulse scale: radius oscillates between 0.7x and 1.3x
      const pulseScale = 0.7 + pulsePhase * 0.6
      // Glow ring is offset from main pulse
      const glowScale = 0.5 + pulsePhase * 1.0

      // 5a. Outer glow ring — large, very transparent, breathes
      list.push(new ScatterplotLayer({
        id: 'pulse-glow',
        data: mappableStations,
        getPosition: d => [d.lng, d.lat],
        getRadius: d => {
          const isSelected = selectedStation?.address === d.address
          const base = isSelected ? 120 : 70
          return base * glowScale
        },
        getFillColor: d => {
          const rgba = getPriceRgba(d, 60)
          // Glow opacity breathes with pulse
          rgba[3] = Math.round(25 + pulsePhase * 45)
          return rgba
        },
        radiusMinPixels: 4,
        radiusMaxPixels: 35,
        pickable: false,
        updateTriggers: {
          getRadius: [glowScale, selectedStation?.address],
          getFillColor: [pulsePhase, priceKey, priceMin, priceMax],
        },
      }))

      // 5b. Main pulse dot — solid, breathes subtly
      list.push(new ScatterplotLayer({
        id: 'pulse-dots',
        data: mappableStations,
        getPosition: d => [d.lng, d.lat],
        getRadius: d => {
          const isSelected = selectedStation?.address === d.address
          const base = isSelected ? 65 : 42
          return base * pulseScale
        },
        getFillColor: d => getPriceRgba(d),
        getLineColor: isDark ? [255, 255, 255, Math.round(80 + pulsePhase * 60)] : [0, 0, 0, 80],
        lineWidthMinPixels: 1.5,
        stroked: true,
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        pickable: true,
        onClick: ({ object }) => { if (object) setSelectedStation(object) },
        updateTriggers: {
          getRadius: [pulseScale, selectedStation?.address],
          getFillColor: [priceKey, priceMin, priceMax],
          getLineColor: [pulsePhase, isDark],
        },
      }))

      // 5c. Selected station highlight ring
      if (selectedStation?.lat && selectedStation?.lng) {
        list.push(new ScatterplotLayer({
          id: 'pulse-selected-ring',
          data: [selectedStation],
          getPosition: d => [d.lng, d.lat],
          getRadius: 80 * pulseScale,
          getFillColor: [0, 0, 0, 0],
          getLineColor: [255, 255, 255, 220],
          lineWidthMinPixels: 3,
          stroked: true,
          filled: false,
          radiusMinPixels: 10,
          radiusMaxPixels: 25,
          pickable: false,
          updateTriggers: {
            getRadius: [pulseScale],
          },
        }))
      }

      // 5d. Price labels (visible when zoomed in)
      if (showLabels) {
        list.push(new TextLayer({
          id: 'pulse-labels',
          data: mappableStations,
          getPosition: d => [d.lng, d.lat],
          getText: d => formatPrice(parseFloat(d[priceKey] || d.price_regular || 0)),
          getColor: d => getPriceRgba(d, 255).slice(0, 3).concat([255]),
          getSize: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '700',
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          getPixelOffset: [0, -18],
          background: true,
          getBackgroundColor: [15, 23, 42, 220],
          getBorderColor: [255, 255, 255, 25],
          getBorderWidth: 1,
          backgroundPadding: [4, 2, 4, 2],
          pickable: false,
          updateTriggers: {
            getText: [priceKey],
            getColor: [priceKey, priceMin, priceMax],
          },
        }))
      }
    }

    // Route layers (drawn when directions active)
    if (directionsRoute?.geometry?.coordinates && routeDrawn > 1) {
      const coords = directionsRoute.geometry.coordinates.slice(0, routeDrawn)
      list.push(new PathLayer({
        id: 'route-glow',
        data: [{ path: coords }],
        getPath: d => d.path,
        getColor: [0, 107, 182, 55],
        getWidth: 14,
        widthUnits: 'pixels',
        capRounded: true,
        jointRounded: true,
        pickable: false,
      }))
      list.push(new PathLayer({
        id: 'route-line',
        data: [{ path: coords }],
        getPath: d => d.path,
        getColor: [0, 107, 182, 230],
        getWidth: 4,
        widthUnits: 'pixels',
        capRounded: true,
        jointRounded: true,
        pickable: false,
      }))
      list.push(new PathLayer({
        id: 'route-core',
        data: [{ path: coords }],
        getPath: d => d.path,
        getColor: [255, 255, 255, 110],
        getWidth: 1.5,
        widthUnits: 'pixels',
        capRounded: true,
        jointRounded: true,
        pickable: false,
      }))
    }
    // User origin dot
    if (directionsOrigin) {
      list.push(new ScatterplotLayer({
        id: 'origin-dot',
        data: [directionsOrigin],
        getPosition: d => [d.lng, d.lat],
        getRadius: 55,
        getFillColor: [255, 255, 255, 220],
        getLineColor: [0, 107, 182, 200],
        lineWidthMinPixels: 3,
        radiusMinPixels: 8,
        pickable: false,
      }))
    }

    return list
  }, [
    isDark,
    mappableStations,
    show3D,
    showLabels,
    priceKey,
    priceMin,
    priceMax,
    selectedStation,
    getPriceRgba,
    setSelectedStation,
    freshestMs,
    directionsRoute,
    directionsOrigin,
    routeDrawn,
    pulsePhase,
  ])

  // ─── Tooltip ──────────────────────────────────────────────────────────────
  const getTooltip = useCallback(({ object }) => {
    if (!object?.station_name) return null
    const price = parseFloat(object[priceKey] || object.price_regular || 0)
    const color = getPriceColor(price, priceMin, priceMax)
    return {
      html: '<div style="padding:10px 14px;font-family:Inter,system-ui,sans-serif;min-width:180px;">'
        + '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">' + object.station_name + '</div>'
        + '<div style="font-weight:800;font-size:20px;color:' + color + ';margin-bottom:6px;">' + formatPrice(price) + '</div>'
        + '<div style="font-size:11px;opacity:0.6;margin-bottom:4px;">' + (object.address || '') + '</div>'
        + (object.price_updated_at ? '<div style="font-size:10px;opacity:0.45;margin-top:4px;">' + formatRelativeTime(object.price_updated_at) + '</div>' : '')
        + '</div>',
      style: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#e2e8f0' : '#1e293b',
        border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        borderRadius: '10px',
        padding: '0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        fontSize: '13px',
      },
    }
  }, [priceKey, priceMin, priceMax, isDark])

  return (
    <div className="relative h-full w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center
                        bg-[#0a0e1a]/80 backdrop-blur-md">
          <div className="text-[#00d4ff] text-xs font-black tracking-[0.35em] uppercase mb-3 animate-pulse">
            Finding Cheapest Gas
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/60"
                   style={{ animation: 'pulse 1s ease-in-out ' + (i * 0.2) + 's infinite' }} />
            ))}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="text-center p-6">
            <p className="font-semibold text-rose-400">Failed to load data</p>
            <p className="mt-1 text-sm text-white/50">{error}</p>
            <button
              onClick={reload}
              className="mt-4 px-4 py-2 bg-[#006BB6] text-white rounded-xl text-sm font-medium hover:bg-[#006BB6]/80 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <DeckGL
        viewState={deckViewState}
        onViewStateChange={({ viewState: vs }) => {
          setDeckViewState(vs)
          setViewState({ longitude: vs.longitude, latitude: vs.latitude, zoom: vs.zoom, pitch: vs.pitch, bearing: vs.bearing })
        }}
        controller={{ touchRotate: true, dragRotate: true }}
        layers={layers}
        getTooltip={getTooltip}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Zoom hint */}
      {!showLabels && !isLoading && !error && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2
                        rounded-full bg-black/70 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
          Zoom in to see station prices
        </div>
      )}

      {/* Price legend (mobile only) */}
      <div className="absolute bottom-20 left-4 z-10 lg:hidden">
        <PriceLegend min={priceMin} max={priceMax} compact />
      </div>

      <MobileBottomSheet stations={filteredStations} />
    </div>
  )
}
