
-- Tighten the insert policies: require source_type and source_id to be set
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (source_type IS NOT NULL AND source_id IS NOT NULL);

DROP POLICY "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (order_id IS NOT NULL AND product_id IS NOT NULL);

-- Also allow staff (admins) to update order item status
CREATE POLICY "Admins can update order items" ON public.order_items FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
