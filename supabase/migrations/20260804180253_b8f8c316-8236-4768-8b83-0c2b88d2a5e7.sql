ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability text NOT NULL DEFAULT 'pronta_entrega';
ALTER TABLE public.products ADD CONSTRAINT products_availability_check CHECK (availability IN ('pronta_entrega','encomenda'));
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products (availability);