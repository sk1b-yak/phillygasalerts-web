import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsOfService() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-philly-blue hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to map
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: March 29, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acceptance of Terms</h2>
            <p>
              By accessing and using PhillyGasAlerts (phillygasalerts.com), you agree to be bound by
              these Terms of Service. If you do not agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Service Description</h2>
            <p>
              PhillyGasAlerts provides real-time gas price information for gas stations in the
              Philadelphia metropolitan area, including Delaware County (PA) and South Jersey.
              The service is provided free of charge and supported by advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Disclaimer of Accuracy</h2>
            <p>
              Gas prices displayed on this site are aggregated from publicly available sources and
              are updated approximately twice daily. <strong>We do not guarantee the accuracy,
              completeness, or timeliness of any price information.</strong> Prices may change between
              updates. Always confirm the current price at the gas station before fueling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Limitation of Liability</h2>
            <p>
              PhillyGasAlerts is provided "as is" without warranties of any kind, either express or
              implied. We shall not be liable for any damages arising from the use of or inability
              to use this service, including but not limited to inaccurate price data, service
              interruptions, or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Scrape, crawl, or programmatically access the site or its API without permission</li>
              <li>Attempt to disrupt or overload the service</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Redistribute our data commercially without written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Intellectual Property</h2>
            <p>
              The PhillyGasAlerts name, logo, design, and software are the property of PhillyGasAlerts.
              Gas station brand logos are the property of their respective owners and are displayed
              for identification purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Advertising</h2>
            <p>
              This site displays advertisements served by Google AdSense and potentially other ad
              networks. Ad content is determined by the ad network and does not constitute an
              endorsement by PhillyGasAlerts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the site
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Contact</h2>
            <p>
              Questions about these terms? Email us at{' '}
              <a href="mailto:alerts@phillygasalerts.com" className="text-philly-blue hover:underline">
                alerts@phillygasalerts.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
