import { Header } from './components/UI/Header'
import { Footer } from './components/UI/Footer'
import { GasMap } from './components/Map/GasMap'

function App() {
  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      <Header />
      <main className="flex-1 overflow-hidden">
        <GasMap />
      </main>
      <Footer />
    </div>
  )
}

export default App
