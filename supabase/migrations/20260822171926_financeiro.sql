-- ============================================================
-- FINANCEIRO: custo x venda x lucro, com PIN próprio de acesso
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) Custo da peça, no cadastro do produto
-- ------------------------------------------------------------
alter table public.products
  add column if not exists cost_price numeric(10,2) not null default 0 check (cost_price >= 0);

comment on column public.products.cost_price is 'Quanto a peça custou (fornecedor) — usado para calcular o lucro na venda.';

-- ------------------------------------------------------------
-- 2) Vendas: cada lançamento congela o custo e o preço de venda
--    do momento e calcula o lucro automaticamente (nunca digitado).
-- ------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  product_size_id uuid references public.product_sizes(id),
  quantity integer not null check (quantity > 0),

  unit_cost_price numeric(10,2) not null,
  unit_sale_price numeric(10,2) not null,

  total_sale_amount numeric(10,2) generated always as (quantity * unit_sale_price) stored,
  total_cost_amount numeric(10,2) generated always as (quantity * unit_cost_price) stored,
  total_profit_amount numeric(10,2) generated always as
    (quantity * unit_sale_price - quantity * unit_cost_price) stored,

  payment_method text,
  customer_name text,
  notes text,

  sold_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

comment on table public.sales is 'Registro financeiro de cada venda, com separação automática de custo e lucro.';

create or replace function public.fn_fill_sale_prices()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.unit_sale_price is null then
    select coalesce(p.sale_price, p.price) into new.unit_sale_price
    from public.products p where p.id = new.product_id;
  end if;

  if new.unit_cost_price is null then
    select p.cost_price into new.unit_cost_price
    from public.products p where p.id = new.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_fill_sale_prices on public.sales;
create trigger trg_fill_sale_prices
  before insert on public.sales
  for each row execute function public.fn_fill_sale_prices();

create index if not exists idx_sales_sold_at on public.sales(sold_at desc);
create index if not exists idx_sales_product_id on public.sales(product_id);

alter table public.sales enable row level security;

create policy "sales admin all" on public.sales for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));

grant select, insert, update, delete on public.sales to authenticated;
grant all on public.sales to service_role;

-- ------------------------------------------------------------
-- 3) Views para o dashboard financeiro
-- ------------------------------------------------------------
create or replace view public.v_financial_daily with (security_invoker = true) as
select
  date_trunc('day', sold_at) as day,
  count(*) as total_sales,
  sum(total_sale_amount) as revenue,
  sum(total_cost_amount) as cost,
  sum(total_profit_amount) as profit
from public.sales
group by date_trunc('day', sold_at)
order by day desc;

create or replace view public.v_financial_by_product with (security_invoker = true) as
select
  p.id as product_id,
  p.name as product_name,
  count(s.id) as units_sold,
  sum(s.total_sale_amount) as revenue,
  sum(s.total_cost_amount) as cost,
  sum(s.total_profit_amount) as profit,
  round(avg(s.total_profit_amount / nullif(s.total_sale_amount, 0)) * 100, 1) as margin_pct
from public.sales s
join public.products p on p.id = s.product_id
group by p.id, p.name
order by profit desc;

grant select on public.v_financial_daily, public.v_financial_by_product to authenticated;

-- ------------------------------------------------------------
-- 4) PIN próprio para destravar a seção /admin/financeiro.
--    Linha única (id sempre true). Nunca lido diretamente pelo
--    cliente — só através das funções abaixo, que nunca devolvem
--    o hash, apenas true/false.
-- ------------------------------------------------------------
create table if not exists public.financial_settings (
  id boolean primary key default true check (id),
  pin_hash text,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.financial_settings enable row level security;
-- Nenhuma policy = nenhum acesso direto via API para authenticated/anon.
-- Todo acesso passa pelas funções SECURITY DEFINER abaixo.
revoke all on public.financial_settings from authenticated, anon;
grant all on public.financial_settings to service_role;

-- Diz ao front se o PIN já foi configurado (não vaza o hash).
create or replace function public.financial_pin_is_configured()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.financial_settings where id = true and pin_hash is not null
  );
$$;
revoke all on function public.financial_pin_is_configured() from public;
grant execute on function public.financial_pin_is_configured() to authenticated;

-- Define ou troca o PIN. Só quem já é admin do painel geral pode.
create or replace function public.financial_pin_configure(new_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_pin is null or length(new_pin) < 4 then
    raise exception 'PIN precisa ter ao menos 4 dígitos';
  end if;

  insert into public.financial_settings (id, pin_hash, failed_attempts, locked_until, updated_at)
  values (true, crypt(new_pin, gen_salt('bf')), 0, null, now())
  on conflict (id) do update
    set pin_hash = excluded.pin_hash,
        failed_attempts = 0,
        locked_until = null,
        updated_at = now();
end;
$$;
revoke all on function public.financial_pin_configure(text) from public;
grant execute on function public.financial_pin_configure(text) to authenticated;

-- Confere o PIN. Bloqueia por 15 min após 5 tentativas erradas.
create or replace function public.financial_pin_verify(input_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row_hash text;
  row_locked_until timestamptz;
  row_attempts integer;
  ok boolean;
begin
  if not public.is_admin() then
    return false;
  end if;

  select pin_hash, locked_until, failed_attempts
    into row_hash, row_locked_until, row_attempts
  from public.financial_settings where id = true;

  if row_hash is null then
    return false; -- PIN ainda não configurado
  end if;

  if row_locked_until is not null and row_locked_until > now() then
    raise exception 'Bloqueado por tentativas incorretas. Tente novamente mais tarde.';
  end if;

  ok := crypt(input_pin, row_hash) = row_hash;

  if ok then
    update public.financial_settings
      set failed_attempts = 0, locked_until = null, updated_at = now()
      where id = true;
  else
    update public.financial_settings
      set failed_attempts = row_attempts + 1,
          locked_until = case when row_attempts + 1 >= 5 then now() + interval '15 minutes' else null end,
          updated_at = now()
      where id = true;
  end if;

  return ok;
end;
$$;
revoke all on function public.financial_pin_verify(text) from public;
grant execute on function public.financial_pin_verify(text) to authenticated;
