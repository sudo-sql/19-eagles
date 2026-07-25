/** Typed, platform-agnostic API layer over Supabase — one place both apps
 *  call, so RLS assumptions and table names live in exactly one module. */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RoundInsert {
  course_id: string; tee_id?: string; owner_id: string;
  holes_played?: 9 | 18; zen_mode?: boolean; side_game_config?: unknown;
}

export function makeApi(supabase: SupabaseClient) {
  return {
    async createRound(round: RoundInsert) {
      const { data, error } = await supabase.from("rounds").insert(round).select().single();
      if (error) throw error;
      return data;
    },
    async addPlayers(roundId: string, players: { profile_id?: string; guest_name?: string; playing_handicap?: number }[]) {
      const rows = players.map((p, i) => ({ ...p, round_id: roundId, position: i }));
      const { data, error } = await supabase.from("round_players").insert(rows).select();
      if (error) throw error;
      return data;
    },
    async completeRound(roundId: string) {
      const { error } = await supabase.from("rounds")
        .update({ completed_at: new Date().toISOString() }).eq("id", roundId);
      if (error) throw error;
    },
    async postHandicapEntry(entry: { profile_id: string; round_id?: string; differential: number; index_after: number; computation: unknown }) {
      const { error } = await supabase.from("handicap_history").insert(entry);
      if (error) throw error;
    },
    async myHandicapHistory(profileId: string) {
      const { data, error } = await supabase.from("handicap_history")
        .select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(40);
      if (error) throw error;
      return data;
    },
    /** Live leaderboard channel for group rounds (Supabase Realtime). */
    subscribeToRound(roundId: string, onScore: (payload: unknown) => void) {
      return supabase
        .channel(`round:${roundId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "hole_scores", filter: `round_id=eq.${roundId}` }, onScore)
        .subscribe();
    },
  };
}
export type FairwayApi = ReturnType<typeof makeApi>;
