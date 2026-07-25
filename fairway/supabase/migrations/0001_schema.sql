-- Fairway schema. PostGIS for course geometry; every user table gets RLS in 0002.
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ============ Profiles (1:1 with auth.users) ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Golfer',
  avatar_url text,
  home_course_id uuid,
  handicap_index numeric(4,1),           -- denormalized latest WHS index
  is_private boolean not null default true,  -- private by default (§7.5)
  premium_until timestamptz,             -- null = free tier
  units text not null default 'yards' check (units in ('yards','meters')),
  zen_mode_default boolean not null default false,
  premium_card_dismissed_until timestamptz,  -- home-card dismiss = 60 days (Fix #1)
  created_at timestamptz not null default now()
);

-- ============ Courses ============
create table courses (
  id uuid primary key default gen_random_uuid(),
  external_id text,                       -- provider id (CourseProvider abstraction)
  source text not null default 'seed' check (source in ('seed','licensed_api','osm','user_mapped')),
  name text not null,
  city text, region text, country text,
  location geography(point, 4326) not null,
  hole_count int not null default 18 check (hole_count in (9,18,27,36)),
  status text not null default 'published' check (status in ('published','pending_review','rejected')),
  contributed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index courses_location_idx on courses using gist(location);

create table course_tees (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,                     -- "Blue", "White"...
  gender text not null default 'any' check (gender in ('any','men','women')),
  course_rating numeric(4,1) not null,    -- 18-hole rating
  slope_rating int not null check (slope_rating between 55 and 155),
  course_rating_9_front numeric(4,1),
  course_rating_9_back numeric(4,1),
  total_yards int
);

create table course_holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 36),
  par int not null check (par between 3 and 6),
  stroke_index int not null check (stroke_index between 1 and 36), -- handicap allocation
  yards_by_tee jsonb not null default '{}',        -- { "Blue": 412, ... }
  green_front geography(point,4326),
  green_center geography(point,4326),
  green_back geography(point,4326),
  tee_points jsonb not null default '{}',          -- { "Blue": {lat,lng}, ... }
  green_polygon geography(polygon,4326),
  fairway_polygon geography(multipolygon,4326),
  bunkers geography(multipolygon,4326),
  water geography(multipolygon,4326),
  unique (course_id, hole_number)
);

-- ============ Rounds & scoring ============
create table rounds (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  tee_id uuid references course_tees(id),
  owner_id uuid not null references profiles(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  holes_played int not null default 18 check (holes_played in (9,18)),
  nine text default 'front' check (nine in ('front','back')),
  zen_mode boolean not null default false,          -- Fix #13, per-round
  side_game_config jsonb,                           -- { skins:{carryover:true}, nassau:{...}, ... }
  is_practice boolean not null default false,
  share_token text unique default encode(gen_random_bytes(9),'base64'), -- spectator link
  sync_revision bigint not null default 0
);

create table round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  profile_id uuid references profiles(id),          -- null = guest player
  guest_name text,
  playing_handicap int not null default 0,
  position int not null default 0,
  check (profile_id is not null or guest_name is not null)
);

create table hole_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  round_player_id uuid not null references round_players(id) on delete cascade,
  hole_number int not null,
  strokes int check (strokes between 1 and 20),
  putts int check (putts between 0 and 10),
  fairway_hit boolean,                              -- null on par 3s
  green_in_regulation boolean,
  penalties int not null default 0,
  sand_shots int not null default 0,
  updated_at timestamptz not null default now(),    -- LWW conflict resolution per hole
  client_updated_at timestamptz,                    -- offline sync tiebreaker
  unique (round_player_id, hole_number)
);

create table shots (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  round_player_id uuid not null references round_players(id) on delete cascade,
  hole_number int not null,
  shot_number int not null,
  club text,
  lie text check (lie in ('tee','fairway','rough','sand','recovery','green','penalty')),
  start_point geography(point,4326),
  end_point geography(point,4326),
  distance_yards numeric(5,1),
  result_lie text,
  created_at timestamptz not null default now()
);

create table clubs_bag (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  club text not null,                               -- 'driver','3w','7i','pw','58',...
  avg_distance_yards numeric(5,1),
  sample_count int not null default 0,              -- auto-learned from tracked shots
  manual_override_yards numeric(5,1),
  unique (profile_id, club)
);

create table handicap_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  round_id uuid references rounds(id),
  differential numeric(5,1) not null,
  index_after numeric(4,1) not null,
  computation jsonb not null,        -- full "show your work" payload (Fix #6)
  created_at timestamptz not null default now()
);

-- ============ Practice ============
create table practice_drills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null check (category in ('putting','short_game','wedges','approach','driving')),
  description text not null,
  rubric jsonb not null,             -- scoring rubric + handicap-benchmarked targets
  est_minutes int not null default 15
);

create table practice_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  plan_generated boolean not null default false
);

create table practice_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  drill_id uuid not null references practice_drills(id),
  raw jsonb not null,                -- per-rep results
  score numeric(6,2) not null,
  benchmark_delta numeric(6,2),      -- vs user's handicap band target
  created_at timestamptz not null default now()
);

-- ============ Social (opt-in) ============
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  icon text not null                  -- name in the custom thin-line icon set
);

create table user_badges (
  profile_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  platform text not null check (platform in ('apple','google','stripe')),
  external_id text not null,          -- RevenueCat/Stripe subscription id
  status text not null check (status in ('active','grace','canceled','expired')),
  renews_at timestamptz,
  created_at timestamptz not null default now()
);

-- Course mapping contributions (user "map this course" flow, admin-moderated)
create table course_contributions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id),
  payload jsonb not null,             -- drawn geometry awaiting moderation
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- updated_at trigger for LWW
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger hole_scores_touch before update on hole_scores
  for each row execute function touch_updated_at();
