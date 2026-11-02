DROP POLICY IF EXISTS "Public can view hotel info" ON public.site_settings;
CREATE POLICY "Public can view hotel info"
ON public.site_settings FOR SELECT
USING (key IN ('hotel_info', 'branding', 'seo', 'site_content'));