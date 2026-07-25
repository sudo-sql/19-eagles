-- Nearby course search (GPS-first course list) + spectator RPC support.
create or replace function courses_nearby(p_lat double precision, p_lng double precision, p_radius_m double precision)
returns table (id uuid, name text, city text, "distanceMeters" double precision)
language sql stable security definer as $$
  select c.id, c.name, c.city,
         st_distance(c.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as "distanceMeters"
  from courses c
  where c.status = 'published'
    and st_dwithin(c.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by 4
  limit 25;
$$;

-- Review-prompt guard (§8): only after a completed, crash-free round, max every 90 days.
alter table profiles add column if not exists last_review_prompt_at timestamptz;
