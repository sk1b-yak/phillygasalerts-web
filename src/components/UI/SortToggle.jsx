import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useStore } from '../../stores/useStore'

export function SortToggle() {
  const { sortOrder, toggleSortOrder } = useStore()
  
  return (
    <button
      onClick={toggleSortOrder}
      className="btn-secondary flex items-center gap-2 text-sm"
    >
      {sortOrder === 'asc' ? (
        <>
          <ArrowUp className="w-4 h-4" />
          <span>Cheapest</span>
        </>
      ) : (
        <>
          <ArrowDown className="w-4 h-4" />
          <span>Most Expensive</span>
        </>
      )}
      <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" />
    </button>
  )
}
