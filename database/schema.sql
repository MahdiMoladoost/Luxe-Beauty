-- Luxe Beauty production-oriented PostgreSQL schema
-- Times are stored as timestamptz (UTC internally) and rendered in Asia/Tehran.
-- Monetary values are stored as bigint in toman to avoid floating-point errors.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type user_role as enum ('customer', 'salon_owner', 'staff', 'support', 'admin');
create type account_status as enum ('pending', 'active', 'suspended', 'deleted');
create type salon_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended');
create type booking_status as enum ('hold', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired');
create type payment_status as enum ('initiated', 'pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded');
create type settlement_status as enum ('requested', 'under_review', 'approved', 'paid', 'rejected');
create type ticket_status as enum ('open', 'pending_customer', 'pending_internal', 'resolved', 'closed');
create type notification_channel as enum ('in_app', 'sms', 'email', 'whatsapp');
create type notification_status as enum ('queued', 'sent', 'delivered', 'failed', 'cancelled');
create type review_status as enum ('pending', 'published', 'hidden', 'rejected');
create type discount_type as enum ('percent', 'fixed');
create type ledger_entry_type as enum ('credit', 'debit', 'hold', 'release', 'refund', 'settlement');

create table users (
  id uuid primary key default gen_random_uuid(),
  mobile varchar(11) not null unique check (mobile ~ '^09[0-9]{9}$'),
  email citext unique,
  first_name varchar(100),
  last_name varchar(100),
  gender varchar(30),
  birth_date date,
  city varchar(100),
  avatar_url text,
  status account_status not null default 'pending',
  mobile_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table otp_challenges (
  id uuid primary key default gen_random_uuid(),
  mobile varchar(11) not null check (mobile ~ '^09[0-9]{9}$'),
  code_hash text not null,
  purpose varchar(50) not null default 'login',
  attempts smallint not null default 0,
  max_attempts smallint not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_challenges_mobile_created_idx on otp_challenges (mobile, created_at desc);

create table cities (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(120) not null unique,
  province varchar(100),
  is_active boolean not null default true,
  latitude numeric(9,6),
  longitude numeric(9,6)
);

create table areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  name varchar(120) not null,
  slug varchar(140) not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  unique (city_id, slug)
);

create table salons (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id),
  city_id uuid references cities(id),
  area_id uuid references areas(id),
  name varchar(180) not null,
  slug varchar(200) not null unique,
  salon_type varchar(60) not null,
  audience varchar(60) not null,
  description text,
  phone varchar(30),
  manager_mobile varchar(11) not null check (manager_mobile ~ '^09[0-9]{9}$'),
  email citext,
  address text not null,
  postal_code varchar(20),
  latitude numeric(9,6),
  longitude numeric(9,6),
  logo_url text,
  cover_url text,
  instagram_url text,
  website_url text,
  status salon_status not null default 'draft',
  verified_at timestamptz,
  suspended_at timestamptz,
  average_rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  successful_booking_count integer not null default 0,
  cancellation_rate numeric(5,2) not null default 0,
  profile_completion smallint not null default 0 check (profile_completion between 0 and 100),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index salons_search_idx on salons (status, city_id, area_id, average_rating desc);
create index salons_owner_idx on salons (owner_user_id);

create table salon_amenities (
  salon_id uuid not null references salons(id) on delete cascade,
  amenity_code varchar(60) not null,
  primary key (salon_id, amenity_code)
);

create table salon_media (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  media_type varchar(30) not null check (media_type in ('cover', 'environment', 'portfolio', 'staff', 'video', 'document')),
  url text not null,
  alt_text varchar(250),
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table salon_documents (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  document_type varchar(80) not null,
  storage_key text not null,
  status varchar(30) not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table staff_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid references users(id),
  full_name varchar(180) not null,
  title varchar(180),
  biography text,
  mobile varchar(11) check (mobile is null or mobile ~ '^09[0-9]{9}$'),
  avatar_url text,
  commission_percent numeric(5,2) check (commission_percent between 0 and 100),
  fixed_commission bigint check (fixed_commission is null or fixed_commission >= 0),
  average_rating numeric(3,2) not null default 0,
  successful_booking_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, user_id)
);
create index staff_members_salon_active_idx on staff_members (salon_id, is_active);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references service_categories(id),
  name varchar(150) not null,
  slug varchar(170) not null unique,
  icon varchar(100),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  category_id uuid not null references service_categories(id),
  name varchar(200) not null,
  slug varchar(220) not null,
  description text,
  audience varchar(40)[] not null default '{}',
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  cleanup_minutes integer not null default 0 check (cleanup_minutes >= 0),
  base_price bigint not null check (base_price >= 0),
  deposit_amount bigint not null default 0 check (deposit_amount >= 0),
  online_bookable boolean not null default true,
  requires_consultation boolean not null default false,
  non_refundable boolean not null default false,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, slug)
);
create index services_salon_category_idx on services (salon_id, category_id, is_active);

create table staff_services (
  staff_id uuid not null references staff_members(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  override_price bigint check (override_price is null or override_price >= 0),
  override_duration_minutes integer check (override_duration_minutes is null or override_duration_minutes > 0),
  is_active boolean not null default true,
  primary key (staff_id, service_id)
);

create table salon_working_hours (
  salon_id uuid not null references salons(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  opens_at time,
  closes_at time,
  break_starts_at time,
  break_ends_at time,
  primary key (salon_id, weekday),
  check ((not is_open) or (opens_at is not null and closes_at is not null and opens_at < closes_at))
);

create table staff_working_hours (
  staff_id uuid not null references staff_members(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_available boolean not null default true,
  starts_at time,
  ends_at time,
  break_starts_at time,
  break_ends_at time,
  primary key (staff_id, weekday),
  check ((not is_available) or (starts_at is not null and ends_at is not null and starts_at < ends_at))
);

create table schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid references staff_members(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  exception_type varchar(30) not null check (exception_type in ('closed', 'leave', 'custom_hours', 'blocked')),
  reason text,
  check (starts_at < ends_at)
);
create index schedule_exceptions_lookup_idx on schedule_exceptions (salon_id, staff_id, starts_at, ends_at);

create table slot_holds (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid not null references staff_members(id) on delete cascade,
  customer_user_id uuid references users(id) on delete cascade,
  anonymous_key uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  service_ids uuid[] not null,
  quote_snapshot jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (customer_user_id is not null or anonymous_key is not null)
);
create index slot_holds_expiry_idx on slot_holds (expires_at);
alter table slot_holds add constraint slot_holds_no_overlap
  exclude using gist (staff_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (expires_at > now());

create table bookings (
  id uuid primary key default gen_random_uuid(),
  tracking_code varchar(40) not null unique,
  customer_user_id uuid not null references users(id),
  salon_id uuid not null references salons(id),
  staff_id uuid not null references staff_members(id),
  source varchar(30) not null default 'online' check (source in ('online', 'manual', 'phone', 'walk_in')),
  status booking_status not null default 'pending_payment',
  payment_status payment_status not null default 'initiated',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  subtotal bigint not null check (subtotal >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  total_amount bigint not null check (total_amount >= 0),
  deposit_amount bigint not null default 0 check (deposit_amount >= 0),
  paid_amount bigint not null default 0 check (paid_amount >= 0),
  customer_note text,
  cancellation_policy_snapshot jsonb not null,
  pricing_snapshot jsonb not null,
  version integer not null default 1,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (discount_amount <= subtotal),
  check (total_amount = subtotal - discount_amount),
  check (deposit_amount <= total_amount),
  check (paid_amount <= total_amount)
);
create index bookings_customer_idx on bookings (customer_user_id, starts_at desc);
create index bookings_salon_status_idx on bookings (salon_id, status, starts_at);
create index bookings_staff_schedule_idx on bookings (staff_id, starts_at, ends_at);
alter table bookings add constraint bookings_no_overlap
  exclude using gist (staff_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (status in ('pending_payment', 'confirmed', 'in_progress'));

create table booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid not null references services(id),
  service_name_snapshot varchar(200) not null,
  duration_minutes integer not null check (duration_minutes > 0),
  unit_price bigint not null check (unit_price >= 0),
  deposit_amount bigint not null default 0 check (deposit_amount >= 0),
  sort_order integer not null default 0
);
create index booking_items_booking_idx on booking_items (booking_id);

create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  from_status booking_status,
  to_status booking_status not null,
  changed_by uuid references users(id),
  reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  customer_user_id uuid not null references users(id),
  gateway varchar(50) not null,
  gateway_authority varchar(200),
  gateway_reference varchar(200),
  idempotency_key varchar(120) not null unique,
  amount bigint not null check (amount > 0),
  status payment_status not null default 'initiated',
  request_payload jsonb,
  verify_payload jsonb,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_gateway_reference_unique on payments (gateway, gateway_reference) where gateway_reference is not null;

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  booking_id uuid references bookings(id),
  amount bigint not null check (amount > 0),
  reason text not null,
  status payment_status not null default 'pending',
  gateway_reference varchar(200),
  requested_by uuid references users(id),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table wallets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id),
  salon_id uuid references salons(id),
  available_balance bigint not null default 0,
  pending_balance bigint not null default 0,
  updated_at timestamptz not null default now(),
  check ((owner_user_id is not null)::integer + (salon_id is not null)::integer = 1)
);

create table wallet_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id),
  booking_id uuid references bookings(id),
  payment_id uuid references payments(id),
  type ledger_entry_type not null,
  amount bigint not null check (amount > 0),
  balance_after bigint not null,
  idempotency_key varchar(120) not null unique,
  description text,
  created_at timestamptz not null default now()
);
create index wallet_entries_wallet_idx on wallet_entries (wallet_id, created_at desc);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id),
  wallet_id uuid not null references wallets(id),
  requested_amount bigint not null check (requested_amount > 0),
  fee_amount bigint not null default 0 check (fee_amount >= 0),
  net_amount bigint not null check (net_amount >= 0),
  status settlement_status not null default 'requested',
  iban varchar(34) not null,
  requested_by uuid not null references users(id),
  reviewed_by uuid references users(id),
  bank_reference varchar(200),
  rejection_reason text,
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  check (net_amount = requested_amount - fee_amount)
);

create table discounts (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references salons(id),
  code varchar(60) unique,
  title varchar(200) not null,
  type discount_type not null,
  value bigint not null check (value > 0),
  max_discount bigint,
  minimum_order bigint not null default 0,
  usage_limit integer,
  per_user_limit integer not null default 1,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  applicable_service_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check ((type = 'percent' and value <= 100) or type = 'fixed')
);

create table discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references discounts(id),
  booking_id uuid not null references bookings(id),
  user_id uuid not null references users(id),
  amount bigint not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (discount_id, booking_id)
);

create table favorites (
  user_id uuid not null references users(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id),
  user_id uuid not null references users(id),
  salon_id uuid not null references salons(id),
  staff_id uuid references staff_members(id),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  quality_rating smallint check (quality_rating between 1 and 5),
  behavior_rating smallint check (behavior_rating between 1 and 5),
  cleanliness_rating smallint check (cleanliness_rating between 1 and 5),
  punctuality_rating smallint check (punctuality_rating between 1 and 5),
  value_rating smallint check (value_rating between 1 and 5),
  body text,
  image_urls text[] not null default '{}',
  status review_status not null default 'pending',
  salon_response text,
  salon_responded_at timestamptz,
  moderated_by uuid references users(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_salon_published_idx on reviews (salon_id, created_at desc) where status = 'published';

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  salon_id uuid references salons(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  channel notification_channel not null,
  template_key varchar(100) not null,
  recipient varchar(250) not null,
  payload jsonb not null default '{}',
  status notification_status not null default 'queued',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  idempotency_key varchar(160) not null unique,
  created_at timestamptz not null default now()
);
create index notifications_queue_idx on notifications (status, scheduled_at) where status = 'queued';

create table tickets (
  id uuid primary key default gen_random_uuid(),
  tracking_code varchar(40) not null unique,
  requester_user_id uuid references users(id),
  salon_id uuid references salons(id),
  booking_id uuid references bookings(id),
  type varchar(60) not null,
  subject varchar(250) not null,
  priority smallint not null default 2 check (priority between 1 and 4),
  status ticket_status not null default 'open',
  assigned_to uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender_user_id uuid references users(id),
  body text not null,
  attachment_urls text[] not null default '{}',
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  staff_id uuid references staff_members(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  title varchar(200),
  description text,
  image_urls text[] not null,
  before_image_url text,
  after_image_url text,
  performed_at date,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references users(id),
  slug varchar(220) not null unique,
  title varchar(250) not null,
  excerpt text,
  body text not null,
  category varchar(120),
  cover_url text,
  status varchar(30) not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  actor_user_id uuid references users(id),
  actor_role user_role,
  action varchar(120) not null,
  entity_type varchar(120) not null,
  entity_id text not null,
  salon_id uuid references salons(id),
  request_id uuid,
  ip_address inet,
  user_agent text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on audit_logs (actor_user_id, created_at desc);
create index audit_logs_salon_idx on audit_logs (salon_id, created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on users for each row execute function set_updated_at();
create trigger salons_set_updated_at before update on salons for each row execute function set_updated_at();
create trigger staff_members_set_updated_at before update on staff_members for each row execute function set_updated_at();
create trigger services_set_updated_at before update on services for each row execute function set_updated_at();
create trigger bookings_set_updated_at before update on bookings for each row execute function set_updated_at();
create trigger payments_set_updated_at before update on payments for each row execute function set_updated_at();
create trigger tickets_set_updated_at before update on tickets for each row execute function set_updated_at();
create trigger blog_posts_set_updated_at before update on blog_posts for each row execute function set_updated_at();

-- Production implementation notes:
-- 1) Run booking hold + payment confirmation in database transactions with SELECT ... FOR UPDATE.
-- 2) Delete expired slot_holds using a scheduled worker; the application must still check expires_at on every read.
-- 3) Store gateway secrets, SMS keys and encryption keys only in a secret manager/environment variables.
-- 4) Add row-level authorization in the application or database; salon users must be scoped to their salon_id.
-- 5) Partition audit_logs and notifications by month once volume requires it.
