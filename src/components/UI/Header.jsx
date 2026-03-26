import { Fuel, Moon, Sun, Monitor } from 'lucide-react'
import { useStore } from '../../stores/useStore'

export function Header() {
  const { theme, toggleTheme } = useStore()
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-philly-blue to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PhillyGasAlerts</h1>
              <p className="text-xs text-blue-100">Philadelphia Gas Prices</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
