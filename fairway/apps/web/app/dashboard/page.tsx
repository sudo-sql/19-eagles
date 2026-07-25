/** Authenticated dashboard mirroring Stats/Practice/Community (§7.7). */
import { supabaseServer } from "@/lib/supabase-server";

export default async function Dashboard() {
  const supabase = await supabaseServer();
  const { data: { user } = { user: null } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-4xl font-black text-fairway-900">
        {user ? `Welcome back` : "Your golf, in one place"}
      </h1>
      {!user && (
        <p className="mt-4 text-charcoal-700">
          Sign in with Apple, Google, or a magic link to see rounds, strokes gained,
          the Inside-100 dashboard, practice history, and your handicap audit trail.
        </p>
      )}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {["Strokes gained", "Inside 100", "Handicap"].map((s) => (
          <div key={s} className="rounded-card bg-cream-50 border border-cream-200 p-6">
            <h2 className="font-semibold">{s}</h2>
            <p className="text-sm text-charcoal-700 mt-2">
              {user ? "Loading your data…" : "Sign in to view."}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
