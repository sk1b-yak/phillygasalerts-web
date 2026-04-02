import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export function AdBanner({ className = '' }) {
  const adRef = useRef(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!adRef.current || pushedRef.current) return
    pushedRef.current = true

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense push failed:', e)
    }
  }, [])

  return (
    <div className={`border-t border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="px-3 py-2">
        <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wider">Sponsored</p>

        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'inline-block', width: 300, height: 250 }}
          data-ad-client="ca-pub-5969510122602447"
          data-ad-slot="6420078507"
        />
      </div>

      {/* Footer links */}
      <div className="px-3 pb-2 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Terms
          </Link>
          <a href="mailto:alerts@phillygasalerts.com" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Contact
          </a>
        </div>
        <span>&copy; 2026 PhillyGasAlerts</span>
      </div>
    </div>
  )
}
