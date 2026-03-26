export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
          <p>© {currentYear} PhillyGasAlerts. Prices update throughout the day.</p>
          <p className="flex items-center gap-1">
            <span className="text-philly-gold">●</span>
            Prices in USD per gallon
          </p>
        </div>
      </div>
    </footer>
  )
}
