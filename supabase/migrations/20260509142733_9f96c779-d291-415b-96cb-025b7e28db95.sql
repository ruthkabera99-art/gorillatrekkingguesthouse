
-- 1. Storage: restrict listing of room-images bucket
-- Drop any overly permissive SELECT policies on storage.objects for this bucket
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (qual ILIKE '%room-images%' OR policyname ILIKE '%room-images%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Only admins can list/select rows in storage.objects for room-images.
-- Note: direct public URLs (storage/v1/object/public/room-images/...) keep working
-- because the bucket remains public for direct file fetches.
CREATE POLICY "Admins can list room-images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'room-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins can upload/update/delete room-images
CREATE POLICY "Admins can upload room-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update room-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'room-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete room-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'room-images' AND public.has_role(auth.uid(), 'admin'));

-- 2. Sequential invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS invoice_number text UNIQUE;

CREATE OR REPLACE FUNCTION public.assign_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_invoice_number() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bookings_assign_invoice_number ON public.bookings;
CREATE TRIGGER bookings_assign_invoice_number
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.assign_invoice_number();

-- Backfill existing rows
UPDATE public.bookings
SET invoice_number = 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 4, '0')
WHERE invoice_number IS NULL;
