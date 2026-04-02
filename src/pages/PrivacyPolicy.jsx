import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPolicy() {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-philly-blue hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to map
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: March 29, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Who We Are</h2>
            <p>
              PhillyGasAlerts ("we," "our," or "us") operates the website phillygasalerts.com. We provide
              real-time gas price information for the Philadelphia, Delaware County, and South Jersey regions.
              You can reach us at <a href="mailto:alerts@phillygasalerts.com" className="text-philly-blue hover:underline">alerts@phillygasalerts.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Information We Collect</h2>
            <p><strong>We do not collect personal information.</strong> Specifically:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do not require account creation or login</li>
              <li>We do not collect names, email addresses, or phone numbers</li>
              <li>We do not track your location (the map is view-only)</li>
              <li>We do not sell or share any user data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cookies &amp; Local Storage</h2>
            <p>
              We use browser local storage to remember your preferences (theme selection, sort order).
              This data stays on your device and is never sent to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Third-Party Services</h2>
            <p>Our site uses the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google AdSense</strong> — We display ads to support the free operation of this site.
                Google may use cookies to serve ads based on your prior visits to this or other websites.
                You can opt out of personalized advertising at{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-philly-blue hover:underline">
                  Google Ad Settings
                </a>.
              </li>
              <li>
                <strong>CARTO Basemaps</strong> — Map tiles are loaded from CARTO's CDN. CARTO's privacy
                policy applies to the loading of these map tiles.
              </li>
              <li>
                <strong>Clearbit Logo API</strong> — We use Clearbit to display gas station brand logos.
                No user data is sent to Clearbit.
              </li>
              <li>
                <strong>Google Fonts</strong> — The Inter font is loaded from Google Fonts. Google's
                privacy policy applies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Sources</h2>
            <p>
              Gas price data is aggregated from publicly available sources and updated twice daily
              (before morning and evening rush hours). We do not guarantee the accuracy of prices
              displayed. Always confirm the price at the pump.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect information
              from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Changes will be posted on this page with
              an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Contact Us</h2>
            <p>
              If you have questions about this privacy policy, contact us at{' '}
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
