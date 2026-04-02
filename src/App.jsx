import { Routes, Route } from 'react-router-dom'
import { PythViewLayout } from './components/Layout/PythViewLayout'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PythViewLayout />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
    </Routes>
  )
}

export default App
