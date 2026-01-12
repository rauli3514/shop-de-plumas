-- COPIA Y PEGA ESTO EN EL SQL EDITOR DE SUPABASE

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- 1. TABLA PRODUCTOS
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  code text,
  name text not null,
  color text,
  size text,
  brand text,
  price numeric not null default 0,
  cost numeric not null default 0,
  stock numeric not null default 0,
  min_stock numeric default 5,
  category text,
  description text,
  image_url text,
  currency text default 'ARS',
  status text default 'in_stock',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA CLIENTES
create table if not exists customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  last_name text,
  phone text,
  email text,
  address text,
  city text,
  province text,
  zip_code text,
  cuit text,
  notes text,
  type text default 'retail', -- 'retail' | 'wholesale'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA VENTAS
create table if not exists sales (
  id uuid default uuid_generate_v4() primary key,
  sale_number serial,
  customer_id uuid references customers(id),
  customer_name text, -- Snapshot del nombre
  subtotal numeric not null default 0,
  discount numeric default 0,
  surcharge numeric default 0,
  total numeric not null default 0,
  total_cost numeric default 0,
  total_profit numeric default 0,
  
  payment_method text,
  payment_status text default 'paid', -- 'paid' | 'pending' | 'checking_account'
  amount_paid numeric default 0,
  balance numeric default 0,
  
  currency text default 'ARS',
  exchange_rate numeric default 1,
  
  items jsonb, -- Array de items de la venta
  
  notes text,
  user_id text, -- ID del vendedor
  user_name text,
  
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA MOVIMIENTOS DE STOCK (Historial)
create table if not exists stock_movements (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id),
  type text not null, -- 'entry' | 'exit' | 'adjustment' | 'sale' | 'return'
  quantity numeric not null,
  previous_stock numeric,
  new_stock numeric,
  reason text,
  reference_id text, -- ID de venta o remito
  user_id text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABLA COTIZACIONES HISTÓRICAS
create table if not exists exchange_rates (
  id uuid default uuid_generate_v4() primary key,
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  source text,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POLÍTICAS DE SEGURIDAD (RLS) - SIMPLE: PÚBLICO LEER/ESCRIBIR PARA MVP
-- En producción deberías restringir esto.
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table stock_movements enable row level security;
alter table exchange_rates enable row level security;

create policy "Acceso total a productos" on products for all using (true) with check (true);
create policy "Acceso total a clientes" on customers for all using (true) with check (true);
create policy "Acceso total a ventas" on sales for all using (true) with check (true);
create policy "Acceso total a stock" on stock_movements for all using (true) with check (true);
create policy "Acceso total a cotizaciones" on exchange_rates for all using (true) with check (true);
