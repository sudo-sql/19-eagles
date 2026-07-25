import { createClient } from "@supabase/supabase-js";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "fairway-auth" });
const mmkvAdapter = {
  getItem: (k: string) => storage.getString(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Null when unconfigured — the app degrades to full offline/guest mode. */
export const supabase = url && anon
  ? createClient(url, anon, { auth: { storage: mmkvAdapter, persistSession: true, autoRefreshToken: true } })
  : null;

export const featureFlags = {
  aiCaddie: Boolean(url), // edge function; also gated by premium + key server-side
  voiceScoring: false,    // experimental: off by default (Fix #12)
  purchases: Boolean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
};
