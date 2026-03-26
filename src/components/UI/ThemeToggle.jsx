import { Sun, Moon, Monitor } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import clsx from 'clsx'

export function ThemeToggle() {
  const { theme, setTheme } = useStore()
  
  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]
  
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={clsx(
            'p-2 rounded-md transition-all',
            theme === value
              ? 'bg-white dark:bg-slate-600 shadow-sm'
              : 'hover:bg-slate-200 dark:hover:bg-slate-600'
          )}
          aria-label={`${label} theme`}
          title={label}
        >
          <Icon className={clsx(
            'w-4 h-4',
            theme === value
              ? 'text-philly-blue'
              : 'text-slate-500 dark:text-slate-400'
          )} />
        </button>
      ))}
    </div>
  )
}
