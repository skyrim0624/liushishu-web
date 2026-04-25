create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text default '',
    reminder_times jsonb default '["07:00","10:00","12:30","15:30","18:30","21:30"]'::jsonb,
    current_offering_pool integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table if exists profiles
    add column if not exists display_name text default '',
    add column if not exists reminder_times jsonb default '["07:00","10:00","12:30","15:30","18:30","21:30"]'::jsonb,
    add column if not exists current_offering_pool integer default 0,
    add column if not exists created_at timestamptz default timezone('utc'::text, now()) not null,
    add column if not exists updated_at timestamptz default timezone('utc'::text, now()) not null;

alter table if exists checkins
    add column if not exists session_index integer;

update checkins set category = 'wealth' where category = 'money';
update checkins set category = 'kindness' where category = 'love';
update checkins set category = 'debug' where category = 'clean';

alter table if exists checkins drop constraint if exists checkins_category_check;
alter table if exists checkins
    add constraint checkins_category_check check (category in ('wealth', 'kindness', 'health', 'debug'));

create table if not exists offering_pool_events (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    amount integer not null default 0,
    event_type text not null default 'withdraw' check (event_type in ('withdraw', 'reset'))
);

alter table profiles enable row level security;
alter table offering_pool_events enable row level security;

drop policy if exists "Allows authenticated users to read their own profile" on profiles;
drop policy if exists "Allows authenticated users to insert their own profile" on profiles;
drop policy if exists "Allows authenticated users to update their own profile" on profiles;
drop policy if exists "Allows users to read their own offering events" on offering_pool_events;
drop policy if exists "Allows users to insert their own offering events" on offering_pool_events;

create policy "Allows authenticated users to read their own profile"
on profiles for select
using (auth.uid() = id);

create policy "Allows authenticated users to insert their own profile"
on profiles for insert
with check (auth.uid() = id);

create policy "Allows authenticated users to update their own profile"
on profiles for update
using (auth.uid() = id);

create policy "Allows users to read their own offering events"
on offering_pool_events for select
using (auth.uid() = user_id);

create policy "Allows users to insert their own offering events"
on offering_pool_events for insert
with check (auth.uid() = user_id);

do $$
begin
    begin
        alter publication supabase_realtime add table profiles;
    exception when duplicate_object then
        null;
    end;
    begin
        alter publication supabase_realtime add table offering_pool_events;
    exception when duplicate_object then
        null;
    end;
end
$$;
