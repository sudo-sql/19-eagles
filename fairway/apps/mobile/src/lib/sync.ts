/** Sync engine: queue-drain with per-hole last-write-wins (client_updated_at
 *  tiebreak) and merge-per-player for group rounds (Fix #16). */
import { db } from "./db.ts";
import { supabase } from "./supabase.ts";

export interface QueueItem { seq: number; entity: string; payload_json: string }

export async function drainQueue(): Promise<{ pushed: number; failed: number }> {
  if (!supabase) return { pushed: 0, failed: 0 };
  const items = db.getAllSync<QueueItem>("select * from sync_queue order by seq limit 200");
  let pushed = 0, failed = 0;
  for (const item of items) {
    const payload = JSON.parse(item.payload_json);
    try {
      if (item.entity === "hole_score") {
        // Per-hole LWW: only overwrite if our client_updated_at is newer.
        const { data: existing } = await supabase
          .from("hole_scores").select("client_updated_at")
          .eq("round_player_id", payload.round_player_id)
          .eq("hole_number", payload.hole_number).maybeSingle();
        if (!existing || (existing.client_updated_at ?? "") < payload.client_updated_at) {
          await supabase.from("hole_scores").upsert(payload, { onConflict: "round_player_id,hole_number" });
        }
      } else {
        await supabase.from(item.entity + "s").upsert(payload);
      }
      db.runSync("delete from sync_queue where seq = ?", [item.seq]);
      pushed++;
    } catch {
      failed++;
      break; // keep order; retry on next connectivity event
    }
  }
  return { pushed, failed };
}

export function enqueue(entity: string, payload: unknown) {
  db.runSync(
    "insert into sync_queue (entity, payload_json, created_at) values (?, ?, ?)",
    [entity, JSON.stringify(payload), new Date().toISOString()],
  );
}
