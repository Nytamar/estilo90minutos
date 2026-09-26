-- ============================================================
-- FINANCEIRO: custo da personalização
-- (o valor COBRADO do cliente pela personalização já existe em
--  customization_fee; isso aqui adiciona o quanto ELA CUSTOU pra
--  loja, pra entrar no cálculo do lucro)
-- ============================================================

drop view if exists public.v_financial_daily;
drop view if exists public.v_financial_by_product;

alter table public.sales
  add column if not exists customization_cost numeric(10,2) not null default 0
    check (customization_cost >= 0);

comment on column public.sales.customization_cost is
  'Quanto a personalização (nome/número, patch, etc.) custou pra loja nesta venda.';

-- total_cost_amount e total_profit_amount precisam ser recriadas para
-- descontar esse custo também.
alter table public.sales drop column total_cost_amount;
alter table public.sales drop column total_profit_amount;

alter table public.sales add column total_cost_amount numeric(10,2)
  generated always as (quantity * unit_cost_price + customization_cost) stored;

alter table public.sales add column total_profit_amount numeric(10,2)
  generated always as (
    (quantity * unit_sale_price + customization_fee)
    - (quantity * unit_cost_price + customization_cost)
  ) stored;

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
