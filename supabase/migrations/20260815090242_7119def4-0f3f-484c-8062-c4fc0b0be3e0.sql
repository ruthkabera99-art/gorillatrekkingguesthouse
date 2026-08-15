-- 1. Move has_role() out of the API-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

DO $do$
DECLARE r record; q text; c text; stmt text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (coalesce(qual,'') || coalesce(with_check,'')) LIKE '%has_role(%'
  LOOP
    q := replace(replace(coalesce(r.qual,''), 'public.has_role(', 'has_role('), 'has_role(', 'private.has_role(');
    c := replace(replace(coalesce(r.with_check,''), 'public.has_role(', 'has_role('), 'has_role(', 'private.has_role(');
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF r.qual IS NOT NULL THEN stmt := stmt || ' USING (' || q || ')'; END IF;
    IF r.with_check IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || c || ')'; END IF;
    EXECUTE stmt;
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. Bookings: server-side pricing + guest column guard
CREATE OR REPLACE FUNCTION public.enforce_booking_guest_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_price numeric; v_nights integer;
BEGIN
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT base_price INTO v_price FROM public.rooms WHERE id = NEW.room_id;
    IF v_price IS NULL THEN RAISE EXCEPTION 'Invalid room'; END IF;
    IF NEW.check_out <= NEW.check_in THEN RAISE EXCEPTION 'Invalid dates'; END IF;
    v_nights := GREATEST(1, NEW.check_out - NEW.check_in);
    NEW.total_price := v_price * v_nights;
    NEW.status := 'pending';
    NEW.payment_method := NULL;
    NEW.payment_reference := NULL;
    NEW.paid_at := NULL;
    NEW.payment_id := NULL;
    RETURN NEW;
  END IF;

  -- Guest UPDATE: only special_requests, plus self-cancellation
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed')) THEN
    NEW.status := OLD.status;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.room_id := OLD.room_id;
  NEW.check_in := OLD.check_in;
  NEW.check_out := OLD.check_out;
  NEW.guests_adults := OLD.guests_adults;
  NEW.guests_children := OLD.guests_children;
  NEW.total_price := OLD.total_price;
  NEW.payment_method := OLD.payment_method;
  NEW.payment_reference := OLD.payment_reference;
  NEW.paid_at := OLD.paid_at;
  NEW.payment_id := OLD.payment_id;
  NEW.invoice_number := OLD.invoice_number;
  NEW.guest_name := OLD.guest_name;
  NEW.guest_phone := OLD.guest_phone;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.enforce_booking_guest_limits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bookings_enforce_guest_limits ON public.bookings;
CREATE TRIGGER bookings_enforce_guest_limits
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_guest_limits();

-- 3. Orders: server-side totals and validated item prices
CREATE OR REPLACE FUNCTION public.enforce_order_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.total := 0;
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.enforce_order_integrity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_enforce_integrity ON public.orders;
CREATE TRIGGER orders_enforce_integrity
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_integrity();

CREATE OR REPLACE FUNCTION public.recalc_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order uuid;
BEGIN
  v_order := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.orders o
     SET total = COALESCE((
       SELECT SUM(oi.quantity * oi.unit_price)
       FROM public.order_items oi
       WHERE oi.order_id = v_order AND oi.status <> 'cancelled'
     ), 0)
   WHERE o.id = v_order;
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.recalc_order_total() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS order_items_recalc_total ON public.order_items;
CREATE TRIGGER order_items_recalc_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_order_total();

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Guests can create orders"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (
  source_type IS NOT NULL
  AND source_id IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND (
    payment_status = 'unpaid'
    OR (
      payment_status = 'charged_to_room'
      AND source_type = 'room'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.user_id = auth.uid()
          AND b.status = 'checked_in'
          AND b.room_id::text = orders.source_id
      )
    )
  )
);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Guests can create order items"
ON public.order_items FOR INSERT TO anon, authenticated
WITH CHECK (
  order_items.quantity > 0
  AND order_items.quantity <= 50
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = order_items.product_id
      AND p.available = true
      AND p.price = order_items.unit_price
      AND p.department = order_items.department
  )
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.status = 'pending'
  )
);