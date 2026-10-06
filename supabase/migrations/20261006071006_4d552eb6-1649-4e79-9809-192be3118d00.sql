-- Helper: does user have any of these roles
CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;
REVOKE ALL ON FUNCTION private.has_any_role(uuid, public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) TO anon, authenticated, service_role;

-- Which admin pages each role may open
CREATE TABLE public.role_permissions (
  role public.app_role PRIMARY KEY,
  tabs text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage role permissions" ON public.role_permissions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.role_permissions (role, tabs) VALUES
  ('waiter', ARRAY['orders','tables']),
  ('kitchen', ARRAY['kitchen']),
  ('bar', ARRAY['bar']),
  ('receptionist', ARRAY['bookings','invoices','orders','rooms']);

-- Waiter ownership of orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_waiter_id uuid;

-- ORDERS access for staff
CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT TO authenticated USING (
  private.has_any_role(auth.uid(), ARRAY['kitchen','bar','receptionist']::public.app_role[])
  OR (private.has_role(auth.uid(), 'waiter') AND (assigned_waiter_id = auth.uid() OR (assigned_waiter_id IS NULL AND status = 'pending')))
);
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (
  private.has_role(auth.uid(), 'receptionist')
  OR (private.has_role(auth.uid(), 'waiter') AND (assigned_waiter_id = auth.uid() OR (assigned_waiter_id IS NULL AND status = 'pending')))
) WITH CHECK (
  private.has_role(auth.uid(), 'receptionist')
  OR (private.has_role(auth.uid(), 'waiter') AND assigned_waiter_id = auth.uid())
);

-- ORDER ITEMS access for staff
CREATE POLICY "Staff can view order items" ON public.order_items FOR SELECT TO authenticated USING (
  private.has_role(auth.uid(), 'receptionist')
  OR (department = 'kitchen' AND private.has_role(auth.uid(), 'kitchen'))
  OR (department = 'bar' AND private.has_role(auth.uid(), 'bar'))
  OR (private.has_role(auth.uid(), 'waiter') AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
        AND (o.assigned_waiter_id = auth.uid() OR (o.assigned_waiter_id IS NULL AND o.status = 'pending'))))
);
CREATE POLICY "Staff can update order items" ON public.order_items FOR UPDATE TO authenticated USING (
  (department = 'kitchen' AND private.has_role(auth.uid(), 'kitchen'))
  OR (department = 'bar' AND private.has_role(auth.uid(), 'bar'))
  OR (private.has_role(auth.uid(), 'waiter') AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.assigned_waiter_id = auth.uid()))
);

-- RECEPTION: bookings, guest profiles
CREATE POLICY "Receptionist can view bookings" ON public.bookings FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'receptionist'));
CREATE POLICY "Receptionist can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'receptionist'));
CREATE POLICY "Receptionist can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'receptionist')) WITH CHECK (private.has_role(auth.uid(), 'receptionist'));
CREATE POLICY "Staff can view profiles" ON public.profiles FOR SELECT TO authenticated USING (private.has_any_role(auth.uid(), ARRAY['receptionist','waiter']::public.app_role[]));

-- Booking guard: receptionist acts like admin
CREATE OR REPLACE FUNCTION public.enforce_booking_guest_limits()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_price numeric; v_nights integer;
BEGIN
  IF auth.uid() IS NULL OR private.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT base_price INTO v_price FROM public.rooms WHERE id = NEW.room_id;
    IF v_price IS NULL THEN RAISE EXCEPTION 'Invalid room'; END IF;
    IF NEW.check_out <= NEW.check_in THEN RAISE EXCEPTION 'Invalid dates'; END IF;
    v_nights := GREATEST(1, NEW.check_out - NEW.check_in);
    NEW.total_price := v_price * v_nights;
    NEW.status := 'pending';
    NEW.payment_method := NULL; NEW.payment_reference := NULL; NEW.paid_at := NULL; NEW.payment_id := NULL;
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed')) THEN
    NEW.status := OLD.status;
  END IF;
  NEW.user_id := OLD.user_id; NEW.room_id := OLD.room_id; NEW.check_in := OLD.check_in; NEW.check_out := OLD.check_out;
  NEW.guests_adults := OLD.guests_adults; NEW.guests_children := OLD.guests_children; NEW.total_price := OLD.total_price;
  NEW.payment_method := OLD.payment_method; NEW.payment_reference := OLD.payment_reference; NEW.paid_at := OLD.paid_at;
  NEW.payment_id := OLD.payment_id; NEW.invoice_number := OLD.invoice_number; NEW.guest_name := OLD.guest_name; NEW.guest_phone := OLD.guest_phone;
  RETURN NEW;
END $function$;

-- Order guard: staff can't change totals; waiters own the orders they take
CREATE OR REPLACE FUNCTION public.enforce_order_integrity()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.total := 0;
    NEW.status := 'pending';
    NEW.assigned_waiter_id := CASE WHEN auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'waiter') THEN auth.uid() ELSE NULL END;
    RETURN NEW;
  END IF;
  NEW.total := OLD.total;
  NEW.source_type := OLD.source_type;
  NEW.user_id := OLD.user_id;
  IF private.has_role(auth.uid(), 'waiter') THEN
    IF OLD.assigned_waiter_id IS NULL THEN NEW.assigned_waiter_id := auth.uid();
    ELSE NEW.assigned_waiter_id := OLD.assigned_waiter_id; END IF;
  END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS orders_enforce_integrity ON public.orders;
CREATE TRIGGER orders_enforce_integrity BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_integrity();

-- Audit log records the real staff role
CREATE OR REPLACE FUNCTION public.write_audit_log()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_old jsonb; v_new jsonb; v_fields text[]; v_role text;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN v_new := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(k) INTO v_fields FROM jsonb_object_keys(v_new) k
     WHERE k <> 'updated_at' AND v_new->k IS DISTINCT FROM v_old->k;
    IF v_fields IS NULL THEN RETURN NEW; END IF;
  END IF;
  IF auth.uid() IS NULL THEN v_role := coalesce(auth.role(), 'system');
  ELSE
    SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = auth.uid()
      ORDER BY (role = 'admin') DESC, (role = 'user') ASC LIMIT 1;
    IF v_role IS NULL OR v_role = 'user' THEN v_role := 'guest'; END IF;
  END IF;
  INSERT INTO public.audit_log (table_name, record_id, action, actor_id, actor_role, old_data, new_data, changed_fields)
  VALUES (TG_TABLE_NAME, COALESCE((v_new->>'id')::uuid, (v_old->>'id')::uuid), TG_OP, auth.uid(), v_role, v_old, v_new, v_fields);
  RETURN COALESCE(NEW, OLD);
END $function$;