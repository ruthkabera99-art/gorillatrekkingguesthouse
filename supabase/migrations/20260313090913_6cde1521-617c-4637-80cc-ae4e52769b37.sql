
-- Site settings table for hotel config, notification prefs, branding
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view settings" ON public.site_settings
  FOR SELECT TO public USING (true);

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hotel_info', '{"name": "Gorilla Trekking Guest House", "phone": "+250 788 000 000", "email": "info@gorillatrekkingguesthouse.com", "address": "Musanze, Rwanda", "currency": "RWF", "description": "Experience the beauty of Rwanda with comfortable accommodation near Volcanoes National Park."}'::jsonb),
  ('notifications', '{"sms_on_booking_created": true, "sms_on_booking_confirmed": true, "sms_on_booking_cancelled": false, "in_app_notifications": true, "admin_phone": ""}'::jsonb),
  ('branding', '{"primary_color": "#b8965a", "logo_url": "", "tagline": "Your Gateway to Gorilla Trekking Adventures"}'::jsonb);
