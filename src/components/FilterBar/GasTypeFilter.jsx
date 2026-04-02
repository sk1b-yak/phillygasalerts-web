import { useStore } from '../../stores/useStore'

const GAS_TYPES = [
  { key: 'regular', label: 'Regular' },
  { key: 'midgrade', label: 'Midgrade' },
  { key: 'premium', label: 'Premium' },
  { key: 'diesel', label: 'Diesel' }
]

export function GasTypeFilter() {
  const selectedGasType = useStore(s => s.selectedGasType)
  const setGasType = useStore(s => s.setGasType)

  return (
    <div className="flex items-center gap-1">
      {GAS_TYPES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setGasType(key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
            selectedGasType === key
              ? 'bg-[#006BB6] text-white'
              : 'bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default GasTypeFilter
