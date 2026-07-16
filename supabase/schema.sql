-- 짝짐 (gym-buddy) — Supabase 스키마
-- 적용: Supabase 대시보드 → SQL Editor에 붙여넣고 실행 (또는 supabase db push)

-- ─────────────────────────────────────────────
-- 1. 헬스장
-- ─────────────────────────────────────────────
create table if not exists public.gyms (
  id          text primary key,
  name        text not null,
  address     text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 프로필 (auth.users와 1:1)
--    회원가입 시 auth.users에 계정이 생기고,
--    온보딩 완료 시 이 테이블에 프로필이 생긴다.
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text not null,
  sex           text not null check (sex in ('male', 'female')),
  body_weight   numeric(5,1) not null check (body_weight between 30 and 200),
  lifts_basis   text not null default 'working' check (lifts_basis in ('working', '1rm')),
  squat         numeric(5,1) not null check (squat between 20 and 400),
  bench         numeric(5,1) not null check (bench between 20 and 400),
  deadlift      numeric(5,1) not null check (deadlift between 20 and 400),
  gym_id        text not null references public.gyms(id),
  -- [{ "day": "mon", "band": "evening" }, ...]
  slots         jsonb not null default '[]'::jsonb,
  style_tags    text[] not null default '{}',
  verification  text not null default 'unverified'
                check (verification in ('unverified', 'peer', 'video')),
  intro         text check (char_length(intro) <= 60),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_gym_id_idx on public.profiles (gym_id);

-- 3대 합계 / 상대강도를 DB에서도 바로 정렬·필터할 수 있게 생성 컬럼으로
alter table public.profiles
  drop column if exists total_lifts,
  drop column if exists relative_strength;

alter table public.profiles
  add column total_lifts numeric(6,1)
    generated always as (squat + bench + deadlift) stored,
  add column relative_strength numeric(6,3)
    generated always as ((squat + bench + deadlift) / nullif(body_weight, 0)) stored;

create index if not exists profiles_relative_strength_idx
  on public.profiles (gym_id, relative_strength);

-- ─────────────────────────────────────────────
-- 3. 매칭 요청
-- ─────────────────────────────────────────────
create table if not exists public.match_requests (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'requested'
                check (status in ('requested', 'accepted', 'met', 'verified')),
  open_chat_url text,
  created_at    timestamptz not null default now(),
  -- 같은 상대에게 중복 요청 금지
  unique (from_user_id, to_user_id),
  -- 자기 자신에게 요청 금지
  check (from_user_id <> to_user_id)
);

create index if not exists match_requests_to_user_idx on public.match_requests (to_user_id);

-- ─────────────────────────────────────────────
-- 4. 실시간 스팟(보조) 요청
-- ─────────────────────────────────────────────
create table if not exists public.spot_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  gym_id          text not null references public.gyms(id),
  exercise        text not null
                  check (exercise in ('벤치프레스', '스쿼트', '데드리프트', '오버헤드프레스')),
  target_weight   numeric(5,1) not null check (target_weight between 20 and 400),
  message         text check (char_length(message) <= 100),
  expires_in_min  int not null default 15 check (expires_in_min in (15, 30, 60)),
  created_at      timestamptz not null default now(),
  -- 만료 시각 — "진행 중" 필터를 DB에서 처리하기 위한 컬럼.
  -- generated column을 쓸 수 없어(아래 참고) 트리거로 채운다.
  expires_at      timestamptz not null default now()
);

-- expires_at 자동 계산
--   generated column을 못 쓰는 이유: 생성 컬럼은 IMMUTABLE 표현식만 허용하는데
--   timestamptz + interval은 타임존/DST에 의존해 STABLE로 분류된다 (ERROR 42P17).
create or replace function public.set_spot_expires_at()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.created_at + make_interval(mins => new.expires_in_min);
  return new;
end;
$$;

drop trigger if exists spot_requests_set_expires_at on public.spot_requests;
create trigger spot_requests_set_expires_at
  before insert or update of created_at, expires_in_min on public.spot_requests
  for each row execute function public.set_spot_expires_at();

create index if not exists spot_requests_gym_expires_idx
  on public.spot_requests (gym_id, expires_at desc);

-- ─────────────────────────────────────────────
-- 5. updated_at 자동 갱신
-- ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 6. RLS (Row Level Security)
-- ─────────────────────────────────────────────
alter table public.gyms          enable row level security;
alter table public.profiles      enable row level security;
alter table public.match_requests enable row level security;
alter table public.spot_requests enable row level security;

-- 헬스장: 누구나 조회 (온보딩 검색에 필요)
drop policy if exists "gyms are viewable by everyone" on public.gyms;
create policy "gyms are viewable by everyone"
  on public.gyms for select
  using (true);

-- 프로필 조회: 비로그인 둘러보기 퍼널을 위해 공개 조회 허용
-- ⚠️ MVP 한정. 프로필에 민감정보(이메일 등)를 절대 넣지 말 것.
--    강화하려면 아래 정책을 지우고 authenticated 전용 정책으로 교체.
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 프로필 생성/수정: 본인만
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 매칭 요청: 당사자만 조회
drop policy if exists "match requests viewable by participants" on public.match_requests;
create policy "match requests viewable by participants"
  on public.match_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "users can send match requests" on public.match_requests;
create policy "users can send match requests"
  on public.match_requests for insert
  with check (auth.uid() = from_user_id);

-- 상태 변경(수락/검증)은 당사자 누구나
drop policy if exists "participants can update match requests" on public.match_requests;
create policy "participants can update match requests"
  on public.match_requests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- 스팟 요청: 공개 조회 (둘러보기), 생성/삭제는 본인만
drop policy if exists "spot requests are viewable by everyone" on public.spot_requests;
create policy "spot requests are viewable by everyone"
  on public.spot_requests for select
  using (true);

drop policy if exists "users can create own spot requests" on public.spot_requests;
create policy "users can create own spot requests"
  on public.spot_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own spot requests" on public.spot_requests;
create policy "users can delete own spot requests"
  on public.spot_requests for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 6-1. Data API 접근 권한 (GRANT)
--   프로젝트 생성 시 "Automatically expose new tables"를 꺼도 동작하도록 명시.
--   ⚠️ GRANT는 "테이블에 접근 가능한가"만 정하고,
--      "어떤 행을 볼 수 있는가"는 위의 RLS 정책이 결정한다.
-- ─────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select on public.gyms to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.match_requests to authenticated;
grant select on public.spot_requests to anon, authenticated;
grant insert, delete on public.spot_requests to authenticated;

-- ─────────────────────────────────────────────
-- 7. 헬스장 멤버 수 (view)
-- ─────────────────────────────────────────────
create or replace view public.gyms_with_counts as
  select
    g.id,
    g.name,
    g.address,
    (select count(*) from public.profiles p where p.gym_id = g.id) as member_count
  from public.gyms g;

grant select on public.gyms_with_counts to anon, authenticated;

-- 뷰가 조회자 권한으로 동작하게 해 profiles의 RLS를 우회하지 않도록 한다
alter view public.gyms_with_counts set (security_invoker = on);

-- ─────────────────────────────────────────────
-- 8. 시드 — 초기 제휴 타깃 헬스장
-- ─────────────────────────────────────────────
insert into public.gyms (id, name, address) values
  ('g1', '스파르타 짐 강남점',   '서울 강남구 테헤란로 12'),
  ('g2', '아이언 팩토리 역삼',   '서울 강남구 역삼로 88'),
  ('g3', '바벨하우스 선릉',      '서울 강남구 선릉로 421'),
  ('g4', '리프트랩 잠실',        '서울 송파구 올림픽로 240'),
  ('g5', '그라인드 짐 홍대',     '서울 마포구 양화로 160'),
  ('g6', '펌프 피트니스 성수',   '서울 성동구 아차산로 49')
on conflict (id) do update
  set name = excluded.name, address = excluded.address;

-- ─────────────────────────────────────────────
-- 9. Realtime — 스팟 보드 실시간 갱신용
-- ─────────────────────────────────────────────
-- 이미 추가돼 있으면 에러가 나므로 재실행 가능하도록 감싼다
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'spot_requests'
  ) then
    alter publication supabase_realtime add table public.spot_requests;
  end if;
end;
$$;
