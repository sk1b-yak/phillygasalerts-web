import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import { getPriceColor } from '../../utils/colors'
import { formatPrice } from '../../utils/formatters'
import { StationPopup } from './StationPopup'
import { useStore } from '../../stores/useStore'

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('fractal-marker-styles')) return;
  const style = document.createElement('style');
  style.id = 'fractal-marker-styles';
  style.innerHTML = `
    @keyframes pulse-core {
      0% { transform: scale(0.85); opacity: 0.8; }
      100% { transform: scale(1.15); opacity: 1; }
    }
    @keyframes spin-1 {
      0% { transform: rotateZ(0deg) rotateX(66deg) rotateZ(0deg); }
      100% { transform: rotateZ(0deg) rotateX(66deg) rotateZ(360deg); }
    }
    @keyframes spin-2 {
      0% { transform: rotateZ(60deg) rotateX(66deg) rotateZ(0deg); }
      100% { transform: rotateZ(60deg) rotateX(66deg) rotateZ(360deg); }
    }
    @keyframes spin-3 {
      0% { transform: rotateZ(120deg) rotateX(66deg) rotateZ(0deg); }
      100% { transform: rotateZ(120deg) rotateX(66deg) rotateZ(360deg); }
    }
    .fractal-logo {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      perspective: 1000px;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .fractal-logo .orbit {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      box-sizing: border-box;
      transform-style: preserve-3d;
    }
    .fractal-logo .electron {
      position: absolute;
      top: -2px;
      left: 50%;
      width: 4px;
      height: 4px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 0 8px 2px #fff;
      margin-left: -2px;
    }
    .price-badge {
      position: absolute;
      top: -28px;
      background: rgba(15, 23, 42, 0.9);
      padding: 3px 8px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 10;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      white-space: nowrap;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-container:hover .price-badge {
      transform: translateY(-4px) scale(1.05);
      background: rgba(15, 23, 42, 0.95);
      border-color: rgba(255,255,255,0.3);
      z-index: 20;
    }
    .marker-container.is-selected .price-badge {
      transform: translateY(-6px) scale(1.1);
      background: rgba(0, 0, 0, 0.95);
      border-color: rgba(255,255,255,0.5);
      box-shadow: 0 6px 16px rgba(0,0,0,0.6);
      z-index: 20;
    }
    .marker-container.is-selected .fractal-logo {
      filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
    }
  `;
  document.head.appendChild(style);
};

function getBrandColors(stationName) {
  const name = (stationName || '').toLowerCase();
  if (name.includes('shell')) return { core: '#fcd116', orbit: '#e31837', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('bp') || name.includes('amoco')) return { core: '#009900', orbit: '#ffcc00', glow: 'rgba(0, 153, 0, 0.8)' };
  if (name.includes('exxon') || name.includes('mobil')) return { core: '#e21833', orbit: '#0033a0', glow: 'rgba(0, 51, 160, 0.8)' };
  if (name.includes('wawa')) return { core: '#ffc425', orbit: '#b3282d', glow: 'rgba(179, 40, 45, 0.8)' };
  if (name.includes('sheetz')) return { core: '#e31837', orbit: '#ffe600', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('chevron')) return { core: '#0054a4', orbit: '#ed1c24', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes('costco')) return { core: '#e31837', orbit: '#005daa', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('turkey hill')) return { core: '#fcd116', orbit: '#0054a4', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes('lukoil')) return { core: '#e31837', orbit: '#ffffff', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('7-eleven') || name.includes('7 eleven')) return { core: '#008000', orbit: '#ff7f00', glow: 'rgba(0, 128, 0, 0.8)' };
  if (name.includes('walmart')) return { core: '#ffc220', orbit: '#0071ce', glow: 'rgba(0, 113, 206, 0.8)' };
  if (name.includes('giant')) return { core: '#e31837', orbit: '#ffffff', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('sunoco')) return { core: '#fcd116', orbit: '#0054a4', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes('gulf')) return { core: '#fcd116', orbit: '#0054a4', glow: 'rgba(252, 209, 22, 0.8)' };
  if (name.includes('valero')) return { core: '#fcd116', orbit: '#00a4e4', glow: 'rgba(0, 164, 228, 0.8)' };
  if (name.includes('marathon')) return { core: '#0054a4', orbit: '#e31837', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes('citgo')) return { core: '#e31837', orbit: '#0054a4', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('conoco')) return { core: '#e31837', orbit: '#ffffff', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('phillips 66')) return { core: '#e31837', orbit: '#000000', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('sinclair')) return { core: '#009900', orbit: '#ffffff', glow: 'rgba(0, 153, 0, 0.8)' };
  if (name.includes('speedway')) return { core: '#e31837', orbit: '#ffffff', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('rutters')) return { core: '#fcd116', orbit: '#e31837', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('royal farms')) return { core: '#009900', orbit: '#0054a4', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes("bj's") || name.includes('bjs')) return { core: '#e31837', orbit: '#000000', glow: 'rgba(227, 24, 55, 0.8)' };
  if (name.includes('sams club') || name.includes("sam's club")) return { core: '#0071ce', orbit: '#8dc63f', glow: 'rgba(0, 113, 206, 0.8)' };
  if (name.includes('delta')) return { core: '#0054a4', orbit: '#e31837', glow: 'rgba(0, 84, 164, 0.8)' };
  if (name.includes('carroll')) return { core: '#0054a4', orbit: '#ffffff', glow: 'rgba(0, 84, 164, 0.8)' };
  
  return { core: '#00f0ff', orbit: '#7000ff', glow: 'rgba(112, 0, 255, 0.8)' };
}

export function StationMarker({ map, station, minPrice, maxPrice }) {
  const markerRef = useRef(null)
  const popupRef = useRef(null)
  const rootRef = useRef(null)
  const { setSelectedStation, selectedStation } = useStore()
  
  const hasReliableLocation = station.has_reliable_location && station.lat != null && station.lng != null

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!hasReliableLocation || !map) return

    // Create marker DOM element
    const el = document.createElement('div')
    el.className = 'custom-marker'
    
    // Create popup DOM element
    const popupNode = document.createElement('div')
    rootRef.current = createRoot(popupNode)
    rootRef.current.render(<StationPopup station={station} />)
    
    // Initialize popup
    popupRef.current = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px'
    }).setDOMContent(popupNode)
    
    // Initialize marker
    markerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([station.lng, station.lat])
      .setPopup(popupRef.current)
      .addTo(map)
      
    // Add click event listener to the marker element
    el.addEventListener('click', () => {
      setSelectedStation(station)
    })
    
    // Add close event listener to popup
    popupRef.current.on('close', () => {
      // Only clear if this is the currently selected station
      if (useStore.getState().selectedStation?.station_name === station.station_name) {
        setSelectedStation(null)
      }
    })

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount()
      }
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, station.lng, station.lat, hasReliableLocation]) // Re-create if location changes

  // Update marker appearance when selection or price changes
  useEffect(() => {
    if (!markerRef.current) return
    
    const el = markerRef.current.getElement()
    const isSelected = selectedStation?.station_name === station.station_name
    const colors = getBrandColors(station.station_name)
    const priceColor = getPriceColor(station.price_regular, minPrice, maxPrice)
    
    const size = isSelected ? 48 : 36
    
    el.innerHTML = `
      <div class="marker-container ${isSelected ? 'is-selected' : ''}" style="
        position: relative; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
      ">
        <div class="price-badge" style="color: ${priceColor}; text-shadow: 0 0 8px ${priceColor}80;">
          ${formatPrice(station.price_regular)}
        </div>

        <div class="fractal-logo" style="
          width: ${size}px;
          height: ${size}px;
        ">
          <div class="core" style="
            position: absolute;
            width: 28%;
            height: 28%;
            background-color: ${colors.core};
            border-radius: 50%;
            box-shadow: 0 0 12px 3px ${colors.glow}, inset 0 0 6px rgba(255,255,255,0.9);
            z-index: 2;
            animation: pulse-core 2s infinite alternate;
          "></div>

          <div class="orbit" style="
            border: 2px solid ${colors.orbit}60;
            animation: spin-1 4s linear infinite;
            box-shadow: inset 0 0 8px ${colors.glow}40, 0 0 8px ${colors.glow}40;
          ">
            <div class="electron"></div>
          </div>

          <div class="orbit" style="
            border: 2px solid ${colors.orbit}60;
            animation: spin-2 5s linear infinite;
            box-shadow: inset 0 0 8px ${colors.glow}40, 0 0 8px ${colors.glow}40;
          ">
            <div class="electron"></div>
          </div>

          <div class="orbit" style="
            border: 2px solid ${colors.orbit}60;
            animation: spin-3 6s linear infinite;
            box-shadow: inset 0 0 8px ${colors.glow}40, 0 0 8px ${colors.glow}40;
          ">
            <div class="electron"></div>
          </div>
        </div>
      </div>
    `
    
    // Handle popup visibility based on selection
    if (isSelected && !popupRef.current.isOpen()) {
      markerRef.current.togglePopup()
    } else if (!isSelected && popupRef.current.isOpen()) {
      markerRef.current.togglePopup()
    }
    
  }, [selectedStation, station.price_regular, minPrice, maxPrice, station.station_name])

  return null
}
