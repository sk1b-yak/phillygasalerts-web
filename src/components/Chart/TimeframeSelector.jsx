import { useStore } from '../../stores/useStore'

export function TimeframeSelector() {
  const selectedTimeframe = useStore(s => s.selectedTimeframe)
  const setTimeframe = useStore(s => s.setTimeframe)

  const options = [
    { value: '2h', label: '2H' },
    { value: '4h', label: '4H' },
    { value: '6h', label: '6H' },
  ]

  return (
    <div className="flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTimeframe(value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            selectedTimeframe === value
              ? 'bg-philly-blue text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          } ${value !== '6h' ? 'border-r border-slate-300 dark:border-slate-600' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
