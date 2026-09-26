-- ============================================================
-- FINANCEIRO: acréscimo de personalização na venda + exclusão
-- ============================================================

-- ------------------------------------------------------------
-- 1) Acréscimo de personalização
--    Valor extra cobrado nessa venda específica (ex.: nome/número
--    na camisa), somado ao faturamento e ao lucro da venda, sem
--    mexer no preço cadastrado do produto nem gerar custo extra.
-- ------------------------------------------------------------
alter table public.sales
  add column if not exists customization_fee numeric(10,2) not null default 0
    check (customization_fee >= 0);

comment on column public.sales.customization_fee is
  'Acréscimo cobrado pela personalização (ex.: nome/número) nesta venda. Entra no faturamento e no lucro; não tem custo associado.';

-- As colunas geradas precisam ser recriadas para incluir o acréscimo.
-- As views que dependem delas são derrubadas e recriadas depois.
drop view if exists public.v_financial_daily;
drop view if exists public.v_financial_by_product;

alter table public.sales drop column total_sale_amount;
alter table public.sales drop column total_profit_amount;

alter table public.sales
  add column total_sale_amount numeric(10,2) generated always as
    (quantity * unit_sale_price + customization_fee) stored;

alter table public.sales
  add column total_profit_amount numeric(10,2) generated always as
    (quantity * unit_sale_price + customization_fee - quantity * unit_cost_price) stored;

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
-- 2) Exclusão de venda
--    A policy "sales admin all" já cobre DELETE (FOR ALL), então
--    o admin autenticado já pode excluir a nível de banco. Isso
--    só reforça a intenção com uma policy dedicada e explícita,
--    caso a policy "for all" acima seja alterada no futuro.
-- ------------------------------------------------------------
drop policy if exists "sales admin delete" on public.sales;
create policy "sales admin delete" on public.sales for delete to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role));
