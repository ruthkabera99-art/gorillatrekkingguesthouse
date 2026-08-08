-- 1. ORDERS: remove blanket anon read
DROP POLICY IF EXISTS "Anon can view orders by source" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.orders FROM anon;

-- 2. ORDER ITEMS: remove blanket public read
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
ON public.order_items FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

REVOKE SELECT ON public.order_items FROM anon;

-- 3. BOOKINGS: only authenticated users may self-insert, with non-null owner
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- 4. SITE SETTINGS: only public-facing hotel info readable by everyone
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Public can view hotel info"
ON public.site_settings FOR SELECT
USING (key IN ('hotel_info', 'branding', 'seo'));

-- 5. USER ROLES: explicit admin-only write policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;

-- 6. SECURITY DEFINER trigger functions must not be directly callable
REVOKE ALL ON FUNCTION public.assign_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrease_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_stock_on_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role must stay executable: it is referenced by RLS policies evaluated as the caller
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;