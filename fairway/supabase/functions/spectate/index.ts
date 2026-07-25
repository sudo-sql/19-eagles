// Spectator access via share token — keeps RLS participant-only (DECISIONS #3).
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { token } = await req.json();
  if (!token || typeof token !== "string") return new Response("bad request", { status: 400 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: round } = await supabase
    .from("rounds").select("id, course_id, courses(name), round_players(id, guest_name, profiles(display_name))")
    .eq("share_token", token).maybeSingle();
  if (!round) return new Response("not found", { status: 404 });
  const { data: scores } = await supabase
    .from("hole_scores").select("round_player_id, hole_number, strokes").eq("round_id", round.id);
  const { data: holes } = await supabase
    .from("course_holes").select("hole_number, par").eq("course_id", round.course_id);
  const parByHole = Object.fromEntries((holes ?? []).map((h) => [h.hole_number, h.par]));
  const leaderboard = (round.round_players as { id: string; guest_name: string | null; profiles: { display_name: string } | null }[]).map((p) => {
    const ps = (scores ?? []).filter((s) => s.round_player_id === p.id);
    return {
      name: p.profiles?.display_name ?? p.guest_name ?? "Player",
      thru: ps.length,
      toPar: ps.reduce((t, s) => t + s.strokes - (parByHole[s.hole_number] ?? 4), 0),
    };
  }).sort((a, b) => a.toPar - b.toPar);
  return Response.json({ courseName: (round.courses as { name: string } | null)?.name, leaderboard });
});
