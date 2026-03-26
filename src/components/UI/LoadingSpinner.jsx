import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <RefreshCw className={clsx(sizes[size], 'animate-spin text-philly-blue')} />
    </div>
  )
}
