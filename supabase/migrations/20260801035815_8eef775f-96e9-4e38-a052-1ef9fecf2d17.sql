
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- helper trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- TAXONOMIES
CREATE TYPE public.taxonomy_type AS ENUM ('category','brand','club','league','country','season');

CREATE TABLE public.taxonomies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.taxonomy_type NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);
CREATE INDEX idx_taxonomies_type ON public.taxonomies(type);
GRANT SELECT ON public.taxonomies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taxonomies TO authenticated;
GRANT ALL ON public.taxonomies TO service_role;
ALTER TABLE public.taxonomies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taxonomies public read" ON public.taxonomies FOR SELECT USING (true);
CREATE POLICY "taxonomies admin write" ON public.taxonomies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  sale_price numeric(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  images text[] NOT NULL DEFAULT '{}',
  category_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  club_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  league_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  country_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  season_id uuid REFERENCES public.taxonomies(id) ON DELETE SET NULL,
  featured boolean NOT NULL DEFAULT false,
  sold_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_created ON public.products(created_at DESC);
CREATE INDEX idx_products_name ON public.products USING gin (to_tsvector('portuguese', name));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STOCK BY SIZE
CREATE TABLE public.product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  position integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, size)
);
CREATE INDEX idx_product_sizes_product ON public.product_sizes(product_id);
GRANT SELECT ON public.product_sizes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sizes TO authenticated;
GRANT ALL ON public.product_sizes TO service_role;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sizes public read" ON public.product_sizes FOR SELECT USING (true);
CREATE POLICY "sizes admin write" ON public.product_sizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter admin read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- VIEWS
CREATE VIEW public.v_product_stock WITH (security_invoker = true) AS
  SELECT p.id AS product_id, p.name, p.code, p.active,
         COALESCE(SUM(s.stock),0)::int AS total_stock
  FROM public.products p LEFT JOIN public.product_sizes s ON s.product_id = p.id
  GROUP BY p.id;
GRANT SELECT ON public.v_product_stock TO anon, authenticated, service_role;

-- DEMO DATA
INSERT INTO public.taxonomies (type,name,slug) VALUES
 ('category','Nacionais','nacionais'),
 ('category','Europeus','europeus'),
 ('category','Seleções','selecoes'),
 ('category','Retrô','retro'),
 ('brand','Nike','nike'),
 ('brand','Adidas','adidas'),
 ('brand','Puma','puma'),
 ('club','Flamengo','flamengo'),
 ('club','Real Madrid','real-madrid'),
 ('club','Sport Recife','sport-recife'),
 ('league','Brasileirão','brasileirao'),
 ('league','La Liga','la-liga'),
 ('country','Brasil','brasil'),
 ('country','Espanha','espanha'),
 ('season','2024/25','2024-25'),
 ('season','2025/26','2025-26');

INSERT INTO public.products (code,name,slug,description,price,sale_price,featured,sold_count,category_id,brand_id,club_id,league_id,country_id,season_id)
SELECT 'CAM-001','Flamengo I 2025/26','flamengo-i-2025-26','Camisa oficial torcedor do Flamengo, tecido leve com tecnologia de secagem rápida.',299.90,229.90,true,84,
 (SELECT id FROM public.taxonomies WHERE slug='nacionais'),(SELECT id FROM public.taxonomies WHERE slug='adidas'),
 (SELECT id FROM public.taxonomies WHERE slug='flamengo'),(SELECT id FROM public.taxonomies WHERE slug='brasileirao'),
 (SELECT id FROM public.taxonomies WHERE slug='brasil'),(SELECT id FROM public.taxonomies WHERE slug='2025-26')
UNION ALL SELECT 'CAM-002','Real Madrid I 2025/26','real-madrid-i-2025-26','Manto branco tradicional do Real Madrid, versão torcedor.',349.90,NULL,true,120,
 (SELECT id FROM public.taxonomies WHERE slug='europeus'),(SELECT id FROM public.taxonomies WHERE slug='adidas'),
 (SELECT id FROM public.taxonomies WHERE slug='real-madrid'),(SELECT id FROM public.taxonomies WHERE slug='la-liga'),
 (SELECT id FROM public.taxonomies WHERE slug='espanha'),(SELECT id FROM public.taxonomies WHERE slug='2025-26')
UNION ALL SELECT 'CAM-003','Brasil Seleção I 2024/25','brasil-selecao-i-2024-25','Camisa amarela da Seleção Brasileira, edição torcedor.',329.90,289.90,true,210,
 (SELECT id FROM public.taxonomies WHERE slug='selecoes'),(SELECT id FROM public.taxonomies WHERE slug='nike'),
 NULL,NULL,(SELECT id FROM public.taxonomies WHERE slug='brasil'),(SELECT id FROM public.taxonomies WHERE slug='2024-25')
UNION ALL SELECT 'CAM-004','Sport Recife Retrô 1987','sport-recife-retro-1987','Camisa retrô comemorativa do título brasileiro de 1987.',279.90,NULL,false,45,
 (SELECT id FROM public.taxonomies WHERE slug='retro'),(SELECT id FROM public.taxonomies WHERE slug='puma'),
 (SELECT id FROM public.taxonomies WHERE slug='sport-recife'),(SELECT id FROM public.taxonomies WHERE slug='brasileirao'),
 (SELECT id FROM public.taxonomies WHERE slug='brasil'),NULL
UNION ALL SELECT 'CAM-005','Flamengo II 2025/26','flamengo-ii-2025-26','Camisa branca reserva do Flamengo, corte atlético.',299.90,NULL,false,32,
 (SELECT id FROM public.taxonomies WHERE slug='nacionais'),(SELECT id FROM public.taxonomies WHERE slug='adidas'),
 (SELECT id FROM public.taxonomies WHERE slug='flamengo'),(SELECT id FROM public.taxonomies WHERE slug='brasileirao'),
 (SELECT id FROM public.taxonomies WHERE slug='brasil'),(SELECT id FROM public.taxonomies WHERE slug='2025-26')
UNION ALL SELECT 'CAM-006','Real Madrid Retrô 2002','real-madrid-retro-2002','Clássico manto dos Galácticos, edição retrô 2002.',319.90,269.90,true,150,
 (SELECT id FROM public.taxonomies WHERE slug='retro'),(SELECT id FROM public.taxonomies WHERE slug='adidas'),
 (SELECT id FROM public.taxonomies WHERE slug='real-madrid'),(SELECT id FROM public.taxonomies WHERE slug='la-liga'),
 (SELECT id FROM public.taxonomies WHERE slug='espanha'),NULL;

INSERT INTO public.product_sizes (product_id,size,stock,position)
SELECT p.id, s.size, s.stock, s.pos
FROM public.products p
CROSS JOIN (VALUES ('P',6,1),('M',10,2),('G',4,3),('GG',0,4)) AS s(size,stock,pos);
