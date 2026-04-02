/**
 * Color schemes for Philly Gas Alerts, rotating by time of day
 * No external dependencies — pure vanilla JS
 */

/**
 * Carbon & Copper: 6 AM - 1:59 PM (hours 6-13)
 * Warm industrial palette with copper accents
 */
const CARBON_COPPER = {
  name: 'carbon-copper',
  label: 'Carbon & Copper',
  basemap: 'light',
  tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  colors: {
    low: '#2A2D35',
    mid: '#B87333',
    high: '#E8D5B7',
    outlier: '#C61E2E',
  }
};

/**
 * Midnight Philly: 2 PM - 8:59 PM (hours 14-20)
 * Dark mode with city blue and yellow accents
 */
const MIDNIGHT_PHILLY = {
  name: 'midnight-philly',
  label: 'Midnight Philly',
  basemap: 'dark',
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  colors: {
    low: '#0A1628',
    mid: '#006BB6',
    high: '#FCD116',
    outlier: '#C61E2E',
  }
};

/**
 * Neon Grid: 9 PM - 5:59 AM (hours 21-23, 0-5)
 * High-contrast neon palette for night viewing
 */
const NEON_GRID = {
  name: 'neon-grid',
  label: 'Neon Grid',
  basemap: 'dark',
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  colors: {
    low: '#0D3B3E',
    mid: '#00E5CC',
    high: '#E0FFF8',
    outlier: '#C61E2E',
  }
};

/**
 * All available color schemes
 * @type {Array<Object>}
 */
const ALL_SCHEMES = [CARBON_COPPER, MIDNIGHT_PHILLY, NEON_GRID];

/**
 * Returns the active color scheme based on current local time (hours)
 * 6 AM - 1:59 PM (6-13): Carbon & Copper
 * 2 PM - 8:59 PM (14-20): Midnight Philly
 * 9 PM - 5:59 AM (21-23, 0-5): Neon Grid
 * @returns {Object} The active color scheme
 */
function getTimeScheme() {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 6 && hours <= 13) {
    return CARBON_COPPER;
  } else if (hours >= 14 && hours <= 20) {
    return MIDNIGHT_PHILLY;
  } else {
    // 21-23, 0-5
    return NEON_GRID;
  }
}

/**
 * Returns a specific scheme by name, or falls back to getTimeScheme()
 * @param {string|null|undefined} name - The scheme name ('carbon-copper', 'midnight-philly', 'neon-grid')
 * @returns {Object} The requested scheme or current time-based scheme
 */
function getSchemeByName(name) {
  if (!name) {
    return getTimeScheme();
  }

  const scheme = ALL_SCHEMES.find(s => s.name === name);
  return scheme || getTimeScheme();
}

/**
 * Interpolates between two hex colors
 * @param {string} colorA - Starting hex color (e.g. '#2A2D35')
 * @param {string} colorB - Ending hex color (e.g. '#B87333')
 * @param {number} t - Progress from 0.0 to 1.0
 * @returns {string} Interpolated hex color with # prefix
 */
function lerpColor(colorA, colorB, t) {
  // Parse hex to RGB integers
  const parseHex = (hex) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };

  // Convert RGB integers back to hex
  const toHex = (r, g, b) => {
    const toHexPart = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHexPart(r) + toHexPart(g) + toHexPart(b);
  };

  const rgbA = parseHex(colorA);
  const rgbB = parseHex(colorB);

  const r = rgbA.r + (rgbB.r - rgbA.r) * t;
  const g = rgbA.g + (rgbB.g - rgbA.g) * t;
  const b = rgbA.b + (rgbB.b - rgbA.b) * t;

  return toHex(r, g, b);
}

/**
 * Returns transition state at boundary times (6:00, 14:00, 21:00)
 * If within a 10-minute window, returns progress; otherwise null
 * @returns {Object|null} { from: scheme, to: scheme, t: number } or null
 */
function getTransitionProgress() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Check for transition windows
  if (hours === 6 && minutes < 10) {
    // 6:00-6:09: neon-grid → carbon-copper
    const t = minutes / 10;
    return {
      from: NEON_GRID,
      to: CARBON_COPPER,
      t: t
    };
  }

  if (hours === 14 && minutes < 10) {
    // 14:00-14:09: carbon-copper → midnight-philly
    const t = minutes / 10;
    return {
      from: CARBON_COPPER,
      to: MIDNIGHT_PHILLY,
      t: t
    };
  }

  if (hours === 21 && minutes < 10) {
    // 21:00-21:09: midnight-philly → neon-grid
    const t = minutes / 10;
    return {
      from: MIDNIGHT_PHILLY,
      to: NEON_GRID,
      t: t
    };
  }

  return null;
}

// Export for CommonJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getTimeScheme,
    getSchemeByName,
    lerpColor,
    getTransitionProgress,
    ALL_SCHEMES,
  };
}

export {
  getTimeScheme,
  getSchemeByName,
  lerpColor,
  getTransitionProgress,
  ALL_SCHEMES,
};
