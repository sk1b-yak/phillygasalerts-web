import { useStore } from '../../stores/useStore'

export function GasTypeFilter() {
  const selectedGasType = useStore(s => s.selectedGasType)
  const setGasType = useStore(s => s.setGasType)

  const options = [
    { value: 'regular', label: 'Regular' },
    { value: 'midgrade', label: 'Midgrade' },
    { value: 'premium', label: 'Premium' },
    { value: 'diesel', label: 'Diesel' },
  ]

  return (
    <div className="flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
      {options.map(({ value, label }, index) => (
        <button
          key={value}
          onClick={() => setGasType(value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            selectedGasType === value
              ? 'bg-philly-blue text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          } ${index < options.length - 1 ? 'border-r border-slate-300 dark:border-slate-600' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
