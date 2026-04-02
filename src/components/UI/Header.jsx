import { Fuel, Moon, Sun, Monitor, Search, X } from 'lucide-react'
import { useStore } from '../../stores/useStore'

export function Header() {
  const { theme, toggleTheme, searchQuery, setSearchQuery } = useStore()

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-philly-blue to-blue-700 text-white shadow-lg">
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Fuel className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-tight">PhillyGasAlerts</h1>
              <p className="text-[10px] text-blue-200 hidden sm:block">Philly &middot; Delco &middot; South Jersey</p>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ZIP, station, or address..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white/15 text-white placeholder-blue-200 text-sm border border-white/10 focus:outline-none focus:bg-white/25 focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/20"
                >
                  <X className="w-3.5 h-3.5 text-blue-200" />
                </button>
              )}
            </div>
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
