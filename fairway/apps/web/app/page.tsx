/** Marketing landing: design system §6 — editorial, calm, one accent. */
import Link from "next/link";

const free = [
  ["GPS rangefinder", "Front / center / back, hazards, tap-anywhere distances"],
  ["Full scorecard", "Groups of 4, six side games, 3-second hole entry"],
  ["WHS handicap", "Correct 9-hole math — and we show you the computation"],
  ["Shot tracking & stats", "Score, FIR, GIR, putts, unlimited history"],
];
const premium = [
  ["AI Caddie", "One sentence, from your real club distances"],
  ["Green contours", "Slope and fall lines on every green"],
  ["Plays-like distances", "Wind and elevation adjusted"],
  ["Advanced filters", "Slice any stat by course, club, or lie"],
];

export default function Landing() {
  return (
    <main className="contour-bg">
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-gold-deep tracking-widest uppercase text-sm">Fairway</p>
        <h1 className="font-display text-5xl md:text-7xl font-black text-fairway-900 mt-4 leading-tight">
          Play the course,<br />not the app.
        </h1>
        <p className="mt-6 text-lg text-charcoal-700 max-w-2xl mx-auto">
          Two taps from your pocket to the first tee. No ads. No upsell walls.
          A handicap that's actually right. Stats that tell you what to practice.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="#stores" className="rounded-2xl bg-fairway-900 px-8 py-4 text-cream-50 font-semibold">
            Get the app
          </Link>
          <Link href="/dashboard" className="rounded-2xl border border-charcoal-700/20 px-8 py-4 font-semibold">
            Open dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-3xl font-black text-fairway-900">Free. Forever. In writing.</h2>
          <p className="mt-2 text-charcoal-700">
            Our free-tier covenant ships inside the app: these features can never move behind the paywall.
          </p>
          <ul className="mt-6 space-y-4">
            {free.map(([t, d]) => (
              <li key={t} className="rounded-card bg-cream-50 p-4 border border-cream-200">
                <span className="font-semibold">{t}</span>
                <p className="text-sm text-charcoal-700">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-3xl font-black text-fairway-900">
            Premium — $39.99/yr <span className="text-base font-sans font-normal">or $4.99/mo</span>
          </h2>
          <p className="mt-2 text-charcoal-700">
            One transparent tier. Cancel in two taps — the button links straight to your store's cancel screen.
            We remind you 7 days before renewal.
          </p>
          <ul className="mt-6 space-y-4">
            {premium.map(([t, d]) => (
              <li key={t} className="rounded-card bg-fairway-900 p-4 text-cream-100">
                <span className="font-semibold text-gold">{t}</span>
                <p className="text-sm opacity-80">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer id="stores" className="mx-auto max-w-5xl px-6 py-16 text-center text-sm text-charcoal-700">
        <p>App Store & Google Play badges land here at launch.</p>
        <div className="mt-4 space-x-6">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </main>
  );
}
