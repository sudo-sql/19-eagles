-- Row Level Security on every table. Course data public-read; users touch only
-- their own data plus rounds they participate in.

alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_tees enable row level security;
alter table course_holes enable row level security;
alter table rounds enable row level security;
alter table round_players enable row level security;
alter table hole_scores enable row level security;
alter table shots enable row level security;
alter table clubs_bag enable row level security;
alter table handicap_history enable row level security;
alter table practice_drills enable row level security;
alter table practice_sessions enable row level security;
alter table practice_results enable row level security;
alter table friendships enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table subscriptions enable row level security;
alter table course_contributions enable row level security;

-- Helper: is the current user a participant in a round?
create or replace function is_round_participant(r_id uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from rounds r
    left join round_players rp on rp.round_id = r.id
    where r.id = r_id and (r.owner_id = auth.uid() or rp.profile_id = auth.uid())
  );
$$;

-- Profiles: own row full access; friends can read non-private profiles.
create policy profiles_self on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_public_read on profiles for select
  using (not is_private or id = auth.uid()
    or exists (select 1 from friendships f where f.status='accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id)
        or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))));

-- Course data: public read; writes via service role / moderation only.
create policy courses_read on courses for select using (status = 'published' or contributed_by = auth.uid());
create policy tees_read on course_tees for select using (true);
create policy holes_read on course_holes for select using (true);
create policy drills_read on practice_drills for select using (true);
create policy badges_read on badges for select using (true);

-- Rounds: owner + participants read/write; spectator reads happen via edge
-- function with the share_token (service role), never anonymous table access.
create policy rounds_rw on rounds for all
  using (owner_id = auth.uid() or is_round_participant(id))
  with check (owner_id = auth.uid());
create policy round_players_rw on round_players for all
  using (is_round_participant(round_id))
  with check (is_round_participant(round_id));
create policy hole_scores_rw on hole_scores for all
  using (is_round_participant(round_id))
  with check (is_round_participant(round_id));
create policy shots_rw on shots for all
  using (is_round_participant(round_id))
  with check (is_round_participant(round_id));

-- Personal data
create policy clubs_bag_rw on clubs_bag for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy handicap_rw on handicap_history for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy sessions_rw on practice_sessions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy results_rw on practice_results for all
  using (exists (select 1 from practice_sessions s where s.id = session_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from practice_sessions s where s.id = session_id and s.profile_id = auth.uid()));

-- Social
create policy friendships_rw on friendships for all
  using (requester_id = auth.uid() or addressee_id = auth.uid())
  with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy user_badges_read on user_badges for select
  using (profile_id = auth.uid()
    or exists (select 1 from profiles p where p.id = profile_id and not p.is_private));

-- Subscriptions: user reads own; writes only via webhooks (service role).
create policy subscriptions_read on subscriptions for select using (profile_id = auth.uid());

-- Contributions: own rows; moderation via service role.
create policy contributions_rw on course_contributions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
