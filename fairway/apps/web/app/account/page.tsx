/** Account & subscription management (§7.7, Fix #4): transparent comparison
 *  before purchase, Stripe Checkout on web, obvious cancel path, data export
 *  and account deletion. */
import Link from "next/link";

const rows: [string, string, string][] = [
  ["GPS rangefinder & scorecard", "✓", "✓"],
  ["Stats, shot tracking, handicap", "✓", "✓"],
  ["Group rounds & side games", "✓", "✓"],
  ["AI Caddie", "—", "✓"],
  ["Green contours & plays-like", "—", "✓"],
  ["Advanced stat filters", "—", "✓"],
];

export default function Account() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-black text-fairway-900">Account</h1>

      <h2 className="mt-10 font-semibold text-xl">What premium adds — and what stays free</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-charcoal-700">
            <th className="py-2">Feature</th><th>Free</th><th>Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([f, a, b]) => (
            <tr key={f} className="border-t border-cream-200">
              <td className="py-2">{f}</td><td>{a}</td><td className="text-gold-deep font-semibold">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action="/api/stripe/checkout" method="POST" className="mt-8 flex gap-4">
        <button name="plan" value="annual" className="rounded-2xl bg-fairway-900 px-6 py-3 text-cream-50 font-semibold">
          $39.99 / year
        </button>
        <button name="plan" value="monthly" className="rounded-2xl border border-charcoal-700/20 px-6 py-3 font-semibold">
          $4.99 / month
        </button>
      </form>
      <p className="mt-3 text-sm text-charcoal-700">
        We email you 7 days before renewal. Cancel anytime — no retention flows, no phone calls.
      </p>

      <h2 className="mt-12 font-semibold text-xl">Your data</h2>
      <div className="mt-4 space-x-6 text-sm">
        <Link href="/api/export" className="underline">Export everything (CSV/JSON)</Link>
        <Link href="/account/delete" className="text-overpar underline">Delete my account</Link>
      </div>
    </main>
  );
}
