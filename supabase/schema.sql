-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- companies
-- ─────────────────────────────────────────
create table if not exists companies (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  gstin        text,
  email        text,
  phone        text,
  address_line_1 text,
  address_line_2 text,
  city         text,
  state        text,
  pincode      text,
  country      text default 'India',
  is_client    boolean default true,
  is_supplier  boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────
-- items
-- ─────────────────────────────────────────
create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  item_name    text not null,
  description  text,
  hsn_sac      text,
  unit         text default 'NOS',
  default_rate numeric not null,
  gst_percent  numeric default 18,
  category     text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────
create table if not exists invoices (
  id                  uuid primary key default gen_random_uuid(),
  invoice_no          text unique not null,
  invoice_date        date not null,
  purchase_order_no   text,
  supplier_ref        text,
  delivery_note       text,
  other_reference     text,
  place_of_supply     text,
  bill_to_company_id  uuid references companies(id),
  ship_to_company_id  uuid references companies(id),
  subtotal            numeric default 0,
  total_sgst          numeric default 0,
  total_cgst          numeric default 0,
  grand_total         numeric default 0,
  amount_in_words     text,
  payment_details     text,
  common_seal_text    text,
  notes               text,
  status              text default 'draft' check (status in ('draft','generated','sent','paid')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─────────────────────────────────────────
-- invoice_items
-- ─────────────────────────────────────────
create table if not exists invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid references invoices(id) on delete cascade,
  item_id      uuid references items(id),
  description  text,
  hsn_sac      text,
  qty          numeric not null,
  unit         text,
  rate         numeric not null,
  amount       numeric not null,
  sgst_percent numeric default 9,
  sgst_amount  numeric default 0,
  cgst_percent numeric default 9,
  cgst_amount  numeric default 0,
  total        numeric not null,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────
-- updated_at trigger helper
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

create or replace trigger items_updated_at
  before update on items
  for each row execute function set_updated_at();

create or replace trigger invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();
