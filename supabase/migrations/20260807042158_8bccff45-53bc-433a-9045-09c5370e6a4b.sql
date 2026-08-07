CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) $$;

REVOKE ALL ON FUNCTION public.admin_exists() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;