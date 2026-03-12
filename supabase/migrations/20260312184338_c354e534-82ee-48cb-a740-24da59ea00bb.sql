
-- Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view room images
CREATE POLICY "Anyone can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Allow admins to upload room images
CREATE POLICY "Admins can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update room images
CREATE POLICY "Admins can update room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete room images
CREATE POLICY "Admins can delete room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND public.has_role(auth.uid(), 'admin')
);
