import { Search, X } from 'lucide-react'
import { useStore } from '../../stores/useStore'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore()
  
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search ZIP or station..."
        className="input pl-10 pr-10"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  )
}
