/** CourseProvider abstraction (§7.4): seed | licensed API | OSM fallback.
 *  Starting a round prefetches ALL course data + tiles into course_cache. */
import { db } from "./db.ts";
import { supabase } from "./supabase.ts";

export interface CourseSummary { id: string; name: string; city?: string; distanceMeters?: number }

export interface CourseProvider {
  searchNearby(lat: number, lng: number, radiusKm: number): Promise<CourseSummary[]>;
  fetchFullCourse(courseId: string): Promise<unknown>;
}

export const supabaseProvider: CourseProvider = {
  async searchNearby(lat, lng, radiusKm) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("courses_nearby", {
      p_lat: lat, p_lng: lng, p_radius_m: radiusKm * 1000,
    });
    if (error) throw error;
    return data ?? [];
  },
  async fetchFullCourse(courseId) {
    if (!supabase) throw new Error("offline");
    const [course, tees, holes] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).single(),
      supabase.from("course_tees").select("*").eq("course_id", courseId),
      supabase.from("course_holes").select("*").eq("course_id", courseId).order("hole_number"),
    ]);
    return { course: course.data, tees: tees.data, holes: holes.data };
  },
};

/** Download-then-play: cache everything needed for a fully offline round. */
export async function prefetchCourse(courseId: string): Promise<void> {
  const payload = await supabaseProvider.fetchFullCourse(courseId);
  db.runSync(
    "insert or replace into course_cache (course_id, payload_json, cached_at) values (?, ?, ?)",
    [courseId, JSON.stringify(payload), new Date().toISOString()],
  );
}

export function getCachedCourse(courseId: string): unknown | null {
  const row = db.getFirstSync<{ payload_json: string }>(
    "select payload_json from course_cache where course_id = ?", [courseId]);
  return row ? JSON.parse(row.payload_json) : null;
}
