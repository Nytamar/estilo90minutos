CREATE SCHEMA IF NOT EXISTS private;

-- internal role check, not exposed via the API schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- safe, invoker-rights helper for the admin UI (relies on user_roles RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- repoint all policies to the private helper
DROP POLICY IF EXISTS "products auth read" ON public.products;
DROP POLICY IF EXISTS "products admin write" ON public.products;
DROP POLICY IF EXISTS "sizes admin write" ON public.product_sizes;
DROP POLICY IF EXISTS "sizes public read" ON public.product_sizes;
DROP POLICY IF EXISTS "coupons admin all" ON public.coupons;
DROP POLICY IF EXISTS "newsletter admin read" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "taxonomies admin write" ON public.taxonomies;

CREATE POLICY "products auth read" ON public.products FOR SELECT TO authenticated
  USING (active = true OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "sizes admin write" ON public.product_sizes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- stock rows only readable for active products
CREATE POLICY "sizes anon read active" ON public.product_sizes FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active = true));
CREATE POLICY "sizes auth read" ON public.product_sizes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active = true)
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "newsletter admin read" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "taxonomies admin write" ON public.taxonomies FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);