CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only administrators can change staff roles' USING ERRCODE = '42501';
  END IF;
  IF _user_id IS NULL OR _role IS NULL THEN
    RAISE EXCEPTION 'Choose an account and a role' USING ERRCODE = '22023';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role here' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text, 0));
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.admin_set_user_role(uuid,public.app_role)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous role changes must not be permitted';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.admin_set_user_role(uuid,public.app_role)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated role-change entry point must be callable';
  END IF;
END $$;