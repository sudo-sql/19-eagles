/** Spectator view: live scoring on web is view-only (§4), via share token. */
import { supabaseServer } from "@/lib/supabase-server";

export default async function SpectatorRound({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await supabaseServer();
  // Reads go through an edge function that validates share_token (RLS stays participant-only).
  const res = supabase
    ? await supabase.functions.invoke("spectate", { body: { token } }).catch(() => null)
    : null;
  const round = (res?.data ?? null) as { courseName?: string; leaderboard?: { name: string; toPar: number; thru: number }[] } | null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-black text-fairway-900">
        {round?.courseName ?? "Live round"}
      </h1>
      <table className="mt-8 w-full text-left">
        <thead><tr className="text-sm text-charcoal-700"><th className="py-2">Player</th><th>Thru</th><th>To par</th></tr></thead>
        <tbody>
          {(round?.leaderboard ?? []).map((p) => (
            <tr key={p.name} className="border-t border-cream-200">
              <td className="py-3 font-semibold">{p.name}</td>
              <td>{p.thru}</td>
              <td className={p.toPar < 0 ? "text-underpar" : p.toPar > 0 ? "text-overpar" : ""}>
                {p.toPar === 0 ? "E" : p.toPar > 0 ? `+${p.toPar}` : p.toPar}
              </td>
            </tr>
          ))}
          {!round && (
            <tr><td colSpan={3} className="py-6 text-charcoal-700">
              This round isn't live right now, or the link has expired.
            </td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
