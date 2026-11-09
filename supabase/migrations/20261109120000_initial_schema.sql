create extension if not exists pgcrypto;

create type public.album_permission as enum ('viewer', 'contributor', 'editor');
create type public.invitation_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.capsule_state as enum ('draft', 'sealed', 'opened');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  biography text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set full_name = coalesce(new.raw_user_meta_data ->> 'full_name', full_name),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_profile_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_auth_user_profile();

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size > 0),
  title text not null default '',
  caption text not null default '',
  taken_at timestamptz,
  location text not null default '',
  category text not null default '',
  is_favorite boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, storage_path)
);
create index photos_owner_date_idx on public.photos (owner_id, taken_at desc);
create index photos_owner_deleted_idx on public.photos (owner_id, deleted_at);

create table public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tag text not null check (length(trim(tag)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (photo_id, tag)
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '',
  category text not null default '',
  cover_photo_id uuid references public.photos(id) on delete set null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index albums_owner_updated_idx on public.albums (owner_id, updated_at desc);

create table public.album_photos (
  album_id uuid not null references public.albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (album_id, photo_id)
);
create index album_photos_photo_idx on public.album_photos (photo_id);

create table public.favorites (
  owner_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, photo_id)
);

create table public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table public.memory_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 240),
  body text not null default '',
  story_date date,
  location text not null default '',
  people text[] not null default '{}',
  category text not null default '',
  state text not null default 'draft' check (state in ('draft', 'private', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.story_photos (
  story_id uuid not null references public.memory_stories(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  primary key (story_id, photo_id)
);
create table public.memory_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  category text not null,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);
create table public.prompt_responses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid references public.memory_prompts(id) on delete set null,
  prompt_text text not null,
  response text not null default '',
  state text not null default 'draft' check (state in ('draft', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.prompt_response_photos (
  response_id uuid not null references public.prompt_responses(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (response_id, photo_id)
);
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  event_date date not null,
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  theme text not null,
  layout text not null,
  cover_photo_id uuid references public.photos(id) on delete set null,
  state text not null default 'draft' check (state in ('draft', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.memory_book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.memory_books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  position integer not null,
  title text not null default '',
  caption text not null default '',
  layout text not null,
  created_at timestamptz not null default now(),
  unique (book_id, position)
);
create table public.memory_book_page_photos (
  page_id uuid not null references public.memory_book_pages(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  primary key (page_id, photo_id)
);

create table public.memory_reels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  theme text not null,
  music_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.memory_reel_items (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.memory_reels(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  position integer not null,
  caption text not null default '',
  duration_seconds numeric(4,1) not null default 4 check (duration_seconds between 1 and 60),
  transition text not null default 'fade',
  unique (reel_id, position)
);

create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  letter text not null default '',
  unlock_at timestamptz not null,
  state public.capsule_state not null default 'draft',
  cover_photo_id uuid references public.photos(id) on delete set null,
  reflection text not null default '',
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state <> 'sealed' or unlock_at > created_at)
);
create table public.time_capsule_photos (
  capsule_id uuid not null references public.time_capsules(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (capsule_id, photo_id)
);
create table public.time_capsule_stories (
  capsule_id uuid not null references public.time_capsules(id) on delete cascade,
  story_id uuid not null references public.memory_stories(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (capsule_id, story_id)
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text not null,
  biography text not null default '',
  birth_date date,
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.family_stories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  story_date date,
  location text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.family_story_members (
  story_id uuid not null references public.family_stories(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (story_id, member_id)
);
create table public.family_story_photos (
  story_id uuid not null references public.family_stories(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary key (story_id, photo_id)
);
create table public.family_milestones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  milestone_date date not null,
  category text not null,
  member_id uuid references public.family_members(id) on delete set null,
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_walls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  layout text not null,
  background text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.memory_wall_items (
  wall_id uuid not null references public.memory_walls(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  size text not null default 'medium',
  caption text not null default '',
  primary key (wall_id, photo_id)
);

create table public.shared_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid references public.albums(id) on delete set null,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.shared_album_members (
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission public.album_permission not null default 'viewer',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (shared_album_id, user_id)
);
create table public.shared_album_invitations (
  id uuid primary key default gen_random_uuid(),
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  permission public.album_permission not null default 'viewer',
  status public.invitation_status not null default 'pending',
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.shared_album_photos (
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  caption text not null default '',
  created_at timestamptz not null default now(),
  primary key (shared_album_id, photo_id)
);
create table public.shared_album_comments (
  id uuid primary key default gen_random_uuid(),
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table public.shared_album_reactions (
  id uuid primary key default gen_random_uuid(),
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'smile', 'memory', 'celebrate')),
  created_at timestamptz not null default now(),
  unique (shared_album_id, photo_id, user_id, reaction)
);
create table public.shared_album_activity (
  id uuid primary key default gen_random_uuid(),
  shared_album_id uuid not null references public.shared_albums(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_owner_created_idx on public.notifications (owner_id, created_at desc);

create table public.user_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  suggestion_type text not null,
  payload jsonb not null,
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deleted_photos (
  photo_id uuid primary key references public.photos(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  deleted_at timestamptz not null default now(),
  purge_after timestamptz not null default (now() + interval '30 days')
);

create index photo_tags_owner_id_idx on public.photo_tags (owner_id);
create index albums_cover_photo_id_idx on public.albums (cover_photo_id);
create index album_photos_owner_id_idx on public.album_photos (owner_id);
create index favorites_photo_id_idx on public.favorites (photo_id);
create index photo_comments_photo_id_idx on public.photo_comments (photo_id);
create index photo_comments_author_id_idx on public.photo_comments (author_id);
create index memory_stories_owner_id_idx on public.memory_stories (owner_id);
create index story_photos_photo_id_idx on public.story_photos (photo_id);
create index story_photos_owner_id_idx on public.story_photos (owner_id);
create index prompt_responses_owner_id_idx on public.prompt_responses (owner_id);
create index prompt_responses_prompt_id_idx on public.prompt_responses (prompt_id);
create index prompt_response_photos_photo_id_idx on public.prompt_response_photos (photo_id);
create index prompt_response_photos_owner_id_idx on public.prompt_response_photos (owner_id);
create index timeline_events_owner_id_idx on public.timeline_events (owner_id);
create index timeline_events_photo_id_idx on public.timeline_events (photo_id);
create index memory_books_owner_id_idx on public.memory_books (owner_id);
create index memory_books_cover_photo_id_idx on public.memory_books (cover_photo_id);
create index memory_book_pages_owner_id_idx on public.memory_book_pages (owner_id);
create index memory_book_page_photos_photo_id_idx on public.memory_book_page_photos (photo_id);
create index memory_book_page_photos_owner_id_idx on public.memory_book_page_photos (owner_id);
create index memory_reels_owner_id_idx on public.memory_reels (owner_id);
create index memory_reel_items_owner_id_idx on public.memory_reel_items (owner_id);
create index memory_reel_items_photo_id_idx on public.memory_reel_items (photo_id);
create index time_capsules_owner_id_idx on public.time_capsules (owner_id);
create index time_capsules_cover_photo_id_idx on public.time_capsules (cover_photo_id);
create index time_capsule_photos_photo_id_idx on public.time_capsule_photos (photo_id);
create index time_capsule_photos_owner_id_idx on public.time_capsule_photos (owner_id);
create index time_capsule_stories_story_id_idx on public.time_capsule_stories (story_id);
create index time_capsule_stories_owner_id_idx on public.time_capsule_stories (owner_id);
create index family_members_owner_id_idx on public.family_members (owner_id);
create index family_members_photo_id_idx on public.family_members (photo_id);
create index family_stories_owner_id_idx on public.family_stories (owner_id);
create index family_story_members_member_id_idx on public.family_story_members (member_id);
create index family_story_members_owner_id_idx on public.family_story_members (owner_id);
create index family_story_photos_photo_id_idx on public.family_story_photos (photo_id);
create index family_story_photos_owner_id_idx on public.family_story_photos (owner_id);
create index family_milestones_owner_id_idx on public.family_milestones (owner_id);
create index family_milestones_member_id_idx on public.family_milestones (member_id);
create index family_milestones_photo_id_idx on public.family_milestones (photo_id);
create index memory_walls_owner_id_idx on public.memory_walls (owner_id);
create index memory_wall_items_photo_id_idx on public.memory_wall_items (photo_id);
create index memory_wall_items_owner_id_idx on public.memory_wall_items (owner_id);
create index shared_albums_owner_id_idx on public.shared_albums (owner_id);
create index shared_albums_album_id_idx on public.shared_albums (album_id);
create index shared_album_members_user_id_idx on public.shared_album_members (user_id);
create index shared_album_invitations_shared_album_id_idx on public.shared_album_invitations (shared_album_id);
create index shared_album_invitations_inviter_id_idx on public.shared_album_invitations (inviter_id);
create index shared_album_photos_photo_id_idx on public.shared_album_photos (photo_id);
create index shared_album_photos_added_by_idx on public.shared_album_photos (added_by);
create index shared_album_comments_shared_album_id_idx on public.shared_album_comments (shared_album_id);
create index shared_album_comments_photo_id_idx on public.shared_album_comments (photo_id);
create index shared_album_comments_author_id_idx on public.shared_album_comments (author_id);
create index shared_album_reactions_photo_id_idx on public.shared_album_reactions (photo_id);
create index shared_album_reactions_user_id_idx on public.shared_album_reactions (user_id);
create index shared_album_activity_shared_album_id_idx on public.shared_album_activity (shared_album_id);
create index shared_album_activity_actor_id_idx on public.shared_album_activity (actor_id);
create index ai_suggestions_owner_id_idx on public.ai_suggestions (owner_id);
create index deleted_photos_owner_id_idx on public.deleted_photos (owner_id);

create or replace function public.is_shared_album_member(target_album uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shared_albums a
    left join public.shared_album_members m
      on m.shared_album_id = a.id and m.user_id = auth.uid()
    where a.id = target_album
      and (a.owner_id = auth.uid() or (m.user_id is not null and m.accepted_at is not null))
  );
$$;

create or replace function public.enforce_capsule_unlock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.state = 'opened' then
    if tg_op = 'INSERT' then
      raise exception 'A time capsule cannot be created in the opened state.';
    end if;
    if old.state <> 'sealed' or new.unlock_at > now() then
      raise exception 'A time capsule can only be opened after unlocking a sealed capsule.';
    end if;
  end if;
  if new.state = 'sealed' and new.unlock_at <= now() then
    raise exception 'A time capsule must unlock in the future when sealed.';
  end if;
  if tg_op = 'UPDATE' and old.state = 'opened' and new.state <> 'opened' then
    raise exception 'An opened time capsule cannot be resealed.';
  end if;
  return new;
end;
$$;
create trigger time_capsule_unlock_guard
  before insert or update on public.time_capsules
  for each row execute function public.enforce_capsule_unlock();

create or replace function public.has_shared_album_permission(
  target_album uuid,
  required_permission public.album_permission
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shared_albums a
    left join public.shared_album_members m
      on m.shared_album_id = a.id and m.user_id = auth.uid()
    where a.id = target_album
      and (
        a.owner_id = auth.uid()
        or (
          m.accepted_at is not null
          and case required_permission
            when 'viewer' then m.permission in ('viewer', 'contributor', 'editor')
            when 'contributor' then m.permission in ('contributor', 'editor')
            when 'editor' then m.permission = 'editor'
          end
        )
      )
  );
$$;

create or replace function public.is_shared_album_owner(target_album uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shared_albums a
    where a.id = target_album and a.owner_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare
  table_name text;
  table_names text[] := array[
    'albums', 'memory_stories', 'prompt_responses', 'timeline_events',
    'memory_books', 'memory_reels', 'family_members', 'family_stories',
    'family_milestones', 'memory_walls', 'notifications', 'ai_suggestions'
  ];
begin
  foreach table_name in array table_names loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (owner_id = (select auth.uid()))',
      table_name || '_delete_own', table_name
    );
  end loop;
end $$;

alter table public.photos enable row level security;
create or replace function public.owns_deleted_photo(target_photo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.photos p
    where p.id = target_photo
      and p.owner_id = auth.uid()
      and p.deleted_at is not null
  );
$$;
create policy "photos_select_active_owner" on public.photos for select to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null);
create policy "photos_select_deleted_owner" on public.photos for select to authenticated
  using (owner_id = (select auth.uid()) and public.owns_deleted_photo(id));
create policy "photos_insert_owner" on public.photos for insert to authenticated
  with check (owner_id = (select auth.uid()) and deleted_at is null);
create policy "photos_update_owner" on public.photos for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table public.deleted_photos enable row level security;
create policy "deleted_photos_select_owner" on public.deleted_photos for select to authenticated
  using (owner_id = (select auth.uid()) and public.owns_deleted_photo(photo_id));
create policy "deleted_photos_insert_owner" on public.deleted_photos for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.owns_deleted_photo(photo_id));
create policy "deleted_photos_delete_owner" on public.deleted_photos for delete to authenticated
  using (owner_id = (select auth.uid()));

alter table public.user_settings enable row level security;
create policy "settings_select_own" on public.user_settings for select to authenticated using (owner_id = (select auth.uid()));
create policy "settings_insert_own" on public.user_settings for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "settings_update_own" on public.user_settings for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table public.memory_prompts enable row level security;
create policy "prompts_read_authenticated" on public.memory_prompts for select to authenticated using (true);

alter table public.photo_tags enable row level security;
alter table public.album_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.photo_comments enable row level security;
alter table public.story_photos enable row level security;
alter table public.prompt_response_photos enable row level security;
alter table public.memory_book_pages enable row level security;
alter table public.memory_book_page_photos enable row level security;
alter table public.memory_reel_items enable row level security;
alter table public.family_story_members enable row level security;
alter table public.family_story_photos enable row level security;
alter table public.memory_wall_items enable row level security;

create policy "photo_tags_photo_owner" on public.photo_tags for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ));
create policy "photos_shared_album_read" on public.photos for select to authenticated
  using (deleted_at is null and exists (
    select 1 from public.shared_album_photos sp
    where sp.photo_id = photos.id and public.is_shared_album_member(sp.shared_album_id)
  ));
create policy "album_photos_owned_records" on public.album_photos for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.albums a join public.photos p on p.id = photo_id
    where a.id = album_id and a.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.albums a join public.photos p on p.id = photo_id
    where a.id = album_id and a.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));
create policy "favorites_photo_owner" on public.favorites for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ));
create policy "photo_comments_own_photo" on public.photo_comments for all to authenticated
  using (author_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ))
  with check (author_id = (select auth.uid()) and exists (
    select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())
  ));
create policy "story_photos_owned_records" on public.story_photos for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_stories s join public.photos p on p.id = photo_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_stories s join public.photos p on p.id = photo_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));
create policy "prompt_response_photos_owned_records" on public.prompt_response_photos for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.prompt_responses r join public.photos p on p.id = photo_id
    where r.id = response_id and r.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.prompt_responses r join public.photos p on p.id = photo_id
    where r.id = response_id and r.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));
create policy "memory_book_pages_owned_parent" on public.memory_book_pages for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_books b where b.id = book_id and b.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_books b where b.id = book_id and b.owner_id = (select auth.uid())
  ));
create policy "memory_book_page_photos_owned_records" on public.memory_book_page_photos for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_book_pages p
    join public.memory_books b on b.id = p.book_id
    join public.photos ph on ph.id = photo_id
    where p.id = page_id and b.owner_id = (select auth.uid()) and ph.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_book_pages p
    join public.memory_books b on b.id = p.book_id
    join public.photos ph on ph.id = photo_id
    where p.id = page_id and b.owner_id = (select auth.uid()) and ph.owner_id = (select auth.uid())
  ));
create policy "memory_reel_items_owned_records" on public.memory_reel_items for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_reels r join public.photos p on p.id = photo_id
    where r.id = reel_id and r.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_reels r join public.photos p on p.id = photo_id
    where r.id = reel_id and r.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));
create policy "family_story_members_owned_records" on public.family_story_members for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.family_stories s join public.family_members m on m.id = member_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and m.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.family_stories s join public.family_members m on m.id = member_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and m.owner_id = (select auth.uid())
  ));
create policy "family_story_photos_owned_records" on public.family_story_photos for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.family_stories s join public.photos p on p.id = photo_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.family_stories s join public.photos p on p.id = photo_id
    where s.id = story_id and s.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));
create policy "memory_wall_items_owned_records" on public.memory_wall_items for all to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_walls w join public.photos p on p.id = photo_id
    where w.id = wall_id and w.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ))
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.memory_walls w join public.photos p on p.id = photo_id
    where w.id = wall_id and w.owner_id = (select auth.uid()) and p.owner_id = (select auth.uid())
  ));

alter table public.time_capsules enable row level security;
create policy "capsules_select_when_unlocked" on public.time_capsules for select to authenticated
  using (owner_id = (select auth.uid()) and (state = 'draft' or unlock_at <= now()));
create policy "capsules_insert_own" on public.time_capsules for insert to authenticated
  with check (owner_id = (select auth.uid()) and state = 'draft');
create policy "capsules_update_draft_or_open" on public.time_capsules for update to authenticated
  using (owner_id = (select auth.uid()) and (state = 'draft' or (unlock_at <= now() and state <> 'draft')))
  with check (owner_id = (select auth.uid()));
create policy "capsules_delete_own" on public.time_capsules for delete to authenticated
  using (owner_id = (select auth.uid()) and state = 'draft');
alter table public.time_capsule_photos enable row level security;
create policy "capsule_photos_select_when_unlocked" on public.time_capsule_photos for select to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c
    where c.id = capsule_id and c.owner_id = (select auth.uid())
      and (c.state = 'draft' or c.unlock_at <= now())
  ));
create policy "capsule_photos_insert_own_draft" on public.time_capsule_photos for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c where c.id = capsule_id and c.owner_id = (select auth.uid()) and c.state = 'draft'
  ));
create policy "capsule_photos_delete_own_draft" on public.time_capsule_photos for delete to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c where c.id = capsule_id and c.owner_id = (select auth.uid()) and c.state = 'draft'
  ));
alter table public.time_capsule_stories enable row level security;
create policy "capsule_stories_select_when_unlocked" on public.time_capsule_stories for select to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c
    where c.id = capsule_id and c.owner_id = (select auth.uid())
      and (c.state = 'draft' or c.unlock_at <= now())
  ));
create policy "capsule_stories_insert_own_draft" on public.time_capsule_stories for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c where c.id = capsule_id and c.owner_id = (select auth.uid()) and c.state = 'draft'
  ));
create policy "capsule_stories_delete_own_draft" on public.time_capsule_stories for delete to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.time_capsules c where c.id = capsule_id and c.owner_id = (select auth.uid()) and c.state = 'draft'
  ));

alter table public.shared_albums enable row level security;
create policy "shared_album_read_members" on public.shared_albums for select to authenticated
  using (public.is_shared_album_member(id));
create policy "shared_album_insert_owner" on public.shared_albums for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (album_id is null or exists (
      select 1 from public.albums a where a.id = album_id and a.owner_id = (select auth.uid())
    ))
  );
create policy "shared_album_update_editor" on public.shared_albums for update to authenticated
  using (public.has_shared_album_permission(id, 'editor'))
  with check (owner_id = (select auth.uid()) and public.has_shared_album_permission(id, 'editor'));
create policy "shared_album_delete_owner" on public.shared_albums for delete to authenticated
  using (owner_id = (select auth.uid()));

alter table public.shared_album_members enable row level security;
create policy "shared_members_read_album" on public.shared_album_members for select to authenticated
  using (public.is_shared_album_member(shared_album_id));
create policy "shared_members_insert_owner" on public.shared_album_members for insert to authenticated
  with check (public.is_shared_album_owner(shared_album_id));
create policy "shared_members_update_owner" on public.shared_album_members for update to authenticated
  using (public.is_shared_album_owner(shared_album_id))
  with check (public.is_shared_album_owner(shared_album_id));
create policy "shared_members_delete_owner_or_self" on public.shared_album_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_shared_album_owner(shared_album_id));

alter table public.shared_album_invitations enable row level security;
create policy "invitations_read_inviter" on public.shared_album_invitations for select to authenticated using (inviter_id = (select auth.uid()));
create policy "invitations_delete_inviter" on public.shared_album_invitations for delete to authenticated
  using (inviter_id = (select auth.uid()) and public.is_shared_album_owner(shared_album_id));

alter table public.shared_album_photos enable row level security;
create policy "shared_photos_read_members" on public.shared_album_photos for select to authenticated
  using (public.is_shared_album_member(shared_album_id));
create policy "shared_photos_add_contributor" on public.shared_album_photos for insert to authenticated
  with check (added_by = (select auth.uid())
    and public.has_shared_album_permission(shared_album_id, 'contributor')
    and exists (select 1 from public.photos p where p.id = photo_id and p.owner_id = (select auth.uid())));
create or replace function public.prevent_shared_photo_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.shared_album_id <> old.shared_album_id
    or new.photo_id <> old.photo_id
    or new.added_by <> old.added_by then
    raise exception 'A shared photograph cannot be reassigned; remove it and add an authorized photograph instead.';
  end if;
  return new;
end;
$$;
create trigger shared_photo_identity_guard
  before update on public.shared_album_photos
  for each row execute function public.prevent_shared_photo_reassignment();
create policy "shared_photos_edit_editor" on public.shared_album_photos for update to authenticated
  using (public.has_shared_album_permission(shared_album_id, 'editor'))
  with check (public.has_shared_album_permission(shared_album_id, 'editor'));
create policy "shared_photos_delete_editor" on public.shared_album_photos for delete to authenticated
  using (public.has_shared_album_permission(shared_album_id, 'editor'));

alter table public.shared_album_comments enable row level security;
create policy "shared_comments_read_members" on public.shared_album_comments for select to authenticated
  using (public.is_shared_album_member(shared_album_id));
create policy "shared_comments_create_members" on public.shared_album_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_shared_album_member(shared_album_id)
    and (photo_id is null or exists (
      select 1 from public.shared_album_photos sp
      where sp.shared_album_id = shared_album_comments.shared_album_id
        and sp.photo_id = shared_album_comments.photo_id
    ))
  );
create policy "shared_comments_delete_author_or_editor" on public.shared_album_comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.has_shared_album_permission(shared_album_id, 'editor'));

alter table public.shared_album_reactions enable row level security;
create policy "shared_reactions_read_members" on public.shared_album_reactions for select to authenticated
  using (public.is_shared_album_member(shared_album_id));
create policy "shared_reactions_create_members" on public.shared_album_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_shared_album_member(shared_album_id)
    and exists (
      select 1 from public.shared_album_photos sp
      where sp.shared_album_id = shared_album_reactions.shared_album_id
        and sp.photo_id = shared_album_reactions.photo_id
    )
  );
create policy "shared_reactions_delete_own" on public.shared_album_reactions for delete to authenticated
  using (user_id = (select auth.uid()) and public.is_shared_album_member(shared_album_id));

alter table public.shared_album_activity enable row level security;
create policy "shared_activity_read_members" on public.shared_album_activity for select to authenticated
  using (public.is_shared_album_member(shared_album_id));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('private-photos', 'private-photos', false, 20971520, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('book-assets', 'book-assets', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "private_storage_read_own" on storage.objects for select to authenticated
  using (bucket_id in ('private-photos', 'profile-photos', 'book-assets') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "shared_photo_storage_read" on storage.objects for select to authenticated
  using (bucket_id = 'private-photos' and exists (
    select 1
    from public.photos p
    join public.shared_album_photos sp on sp.photo_id = p.id
    where p.storage_path = storage.objects.name
      and public.is_shared_album_member(sp.shared_album_id)
  ));
create policy "private_storage_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id in ('private-photos', 'profile-photos', 'book-assets') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private_storage_update_own" on storage.objects for update to authenticated
  using (bucket_id in ('private-photos', 'profile-photos', 'book-assets') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('private-photos', 'profile-photos', 'book-assets') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private_storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id in ('private-photos', 'profile-photos', 'book-assets') and (storage.foldername(name))[1] = (select auth.uid())::text);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

do $$
declare
  unsecured_table text;
begin
  select c.relname into unsecured_table
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity
  limit 1;
  if unsecured_table is not null then
    raise exception 'RLS is not enabled on public.%', unsecured_table;
  end if;
end $$;
