/** Draft terms — flagged for legal review in HANDOFF.md. */
export default function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-black text-fairway-900">Terms of Service (draft)</h1>
      <p className="mt-4">Draft boilerplate pending legal review. Key commitments baked into the product:</p>
      <ul className="mt-4 list-disc pl-6 space-y-2 text-sm">
        <li>The free-tier covenant: GPS, scorecard, basic stats, manual shot tracking, and handicap are free and will not migrate behind the paywall.</li>
        <li>Subscriptions run only through Apple, Google, or Stripe Checkout; cancellation is available at any time via those platforms.</li>
        <li>Renewal reminders are sent 7 days before each renewal.</li>
        <li>Handicaps are computed per the published World Handicap System rules; Fairway is not an official handicap authority.</li>
      </ul>
    </main>
  );
}
