CREATE TABLE IF NOT EXISTS public.home_ticker_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  text text NOT NULL,

  link_url text,

  new_tab boolean NOT NULL DEFAULT false,

  position integer NOT NULL DEFAULT 0,

  active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_ticker_messages TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.home_ticker_messages
TO authenticated;

GRANT ALL
ON public.home_ticker_messages
TO service_role;

ALTER TABLE public.home_ticker_messages
ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Avisos ativos sao publicos"
ON public.home_ticker_messages;

CREATE POLICY "Avisos ativos sao publicos"
ON public.home_ticker_messages
FOR SELECT
TO anon, authenticated
USING (active = true);


DROP POLICY IF EXISTS "Admins gerenciam avisos"
ON public.home_ticker_messages;

CREATE POLICY "Admins gerenciam avisos"
ON public.home_ticker_messages
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
