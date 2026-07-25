/** Offline-first round storage (Fix #16): SQLite is the source of truth on
 *  device; a sync queue pushes to Supabase with per-hole LWW resolution. */
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("fairway.db");

export function migrate() {
  db.execSync(`
    create table if not exists local_rounds (
      id text primary key, course_json text not null, tee_json text,
      started_at text not null, completed_at text, zen_mode integer default 0,
      side_games_json text, holes_played integer default 18, synced integer default 0
    );
    create table if not exists local_players (
      id text primary key, round_id text not null, profile_id text, guest_name text,
      playing_handicap integer default 0, position integer default 0
    );
    create table if not exists local_scores (
      round_id text not null, player_id text not null, hole integer not null,
      strokes integer, putts integer, fairway_hit integer, gir integer,
      penalties integer default 0, sand_shots integer default 0,
      client_updated_at text not null,
      primary key (round_id, player_id, hole)
    );
    create table if not exists local_shots (
      id text primary key, round_id text not null, player_id text not null,
      hole integer not null, shot_number integer not null, club text, lie text,
      start_lat real, start_lng real, end_lat real, end_lng real, distance_yards real
    );
    create table if not exists sync_queue (
      seq integer primary key autoincrement, entity text not null,
      payload_json text not null, created_at text not null
    );
    create table if not exists course_cache (
      course_id text primary key, payload_json text not null, cached_at text not null
    );
  `);
}
