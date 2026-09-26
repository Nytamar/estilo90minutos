CREATE TABLE IF NOT EXISTS public.home_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  mobile_image_url text,
  link_url text,
  new_tab boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_promotions TO authenticated;
GRANT ALL ON public.home_promotions TO service_role;

ALTER TABLE public.home_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Novidades ativas sao publicas"
ON public.home_promotions;

CREATE POLICY "Novidades ativas sao publicas"
ON public.home_promotions
FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Admins gerenciam novidades"
ON public.home_promotions;

CREATE POLICY "Admins gerenciam novidades"
ON public.home_promotions
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
