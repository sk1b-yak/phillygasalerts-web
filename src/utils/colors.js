// Price color utilities

export function getPriceColor(price, minPrice, maxPrice) {
  if (!price || minPrice === undefined || maxPrice === undefined) {
    return '#6B9F4D' // Default green
  }
  
  const p = parseFloat(price)
  const min = parseFloat(minPrice)
  const max = parseFloat(maxPrice)
  
  if (max === min) return '#FCD116' // Gold for equal prices
  
  const normalized = (p - min) / (max - min)
  
  // Philadelphia themed gradient: Blue -> Gold -> Crimson
  if (normalized < 0.33) {
    return '#006BB6' // Philadelphia Blue (cheap)
  } else if (normalized < 0.66) {
    return '#FCD116' // Philadelphia Gold (medium)
  } else {
    return '#C61E2E' // Crimson (expensive)
  }
}

export function getPriceColorClass(price, minPrice, maxPrice) {
  if (!price || minPrice === undefined || maxPrice === undefined) {
    return 'text-philly-green'
  }
  
  const p = parseFloat(price)
  const min = parseFloat(minPrice)
  const max = parseFloat(maxPrice)
  
  if (max === min) return 'text-philly-gold'
  
  const normalized = (p - min) / (max - min)
  
  if (normalized < 0.33) {
    return 'text-philly-blue'
  } else if (normalized < 0.66) {
    return 'text-philly-gold'
  } else {
    return 'text-philly-crimson'
  }
}

export function getPriceLabel(price, minPrice, maxPrice) {
  if (!price || minPrice === undefined || maxPrice === undefined) {
    return 'Unknown'
  }
  
  const p = parseFloat(price)
  const min = parseFloat(minPrice)
  const max = parseFloat(maxPrice)
  
  if (max === min) return 'Average'
  
  const normalized = (p - min) / (max - min)
  
  if (normalized < 0.25) return 'Cheap'
  if (normalized < 0.5) return 'Below Average'
  if (normalized < 0.75) return 'Above Average'
  return 'Expensive'
}

// Heatmap gradient colors
export const HEATMAP_GRADIENT = {
  0.0: '#006BB6', // Philadelphia Blue
  0.25: '#22C55E', // Green
  0.5: '#FCD116', // Gold
  0.75: '#F97316', // Orange
  1.0: '#C61E2E' // Crimson
}
