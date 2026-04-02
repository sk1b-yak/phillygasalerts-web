/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neon Void palette - The Nocturnal Grid
        void: {
          black: '#030305',
          charcoal: '#0A0A0F',
          grid: '#1A1A24',
        },
        // Catalyst colors for CTAs
        catalyst: {
          violet: '#7000FF',
          cyan: '#00F0FF',
        },
        // Price indicator colors
        price: {
          acid: '#CCFF00',
          crimson: '#FF2A4D',
        },
        // Legacy Philadelphia colors (backward compatibility)
        philly: {
          blue: '#006BB6',
          gold: '#FCD116',
          navy: '#1B365D',
          green: '#6B9F4D',
          crimson: '#C61E2E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon': '0 0 10px currentColor, 0 0 20px currentColor',
        'neon-sm': '0 0 5px currentColor, 0 0 10px currentColor',
        'glass': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
        'glass-sm': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
      }
    },
  },
  plugins: [],
}
