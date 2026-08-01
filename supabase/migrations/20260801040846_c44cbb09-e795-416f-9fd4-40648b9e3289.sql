
DROP POLICY "products public read" ON public.products;
CREATE POLICY "products anon read active" ON public.products FOR SELECT TO anon USING (active = true);
CREATE POLICY "products auth read" ON public.products FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(),'admin'));
