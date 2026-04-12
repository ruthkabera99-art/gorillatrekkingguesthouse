-- Add phone column to profiles if not exists (for WhatsApp number signup)
-- phone column already exists, so just ensure it's there
-- No schema changes needed, phone is already on profiles table

-- We need to update handle_new_user to also store phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;