ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_booking_id_idx ON public.orders(booking_id);

CREATE OR REPLACE FUNCTION public.link_order_to_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.booking_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.source_type = 'room' THEN
    SELECT b.id INTO NEW.booking_id FROM bookings b JOIN rooms r ON r.id = b.room_id
    WHERE (b.room_id::text = NEW.source_id OR r.name = NEW.source_id)
      AND b.status = 'checked_in'
    ORDER BY b.check_in DESC LIMIT 1;
  END IF;
  IF NEW.booking_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT b.id INTO NEW.booking_id FROM bookings b
    WHERE b.user_id = NEW.user_id AND b.status = 'checked_in'
    ORDER BY b.check_in DESC LIMIT 1;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.link_order_to_booking() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS link_order_to_booking ON public.orders;
CREATE TRIGGER link_order_to_booking BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.link_order_to_booking();

CREATE OR REPLACE FUNCTION public.link_orders_on_checkin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rname text;
BEGIN
  IF NEW.status = 'checked_in' AND OLD.status IS DISTINCT FROM 'checked_in' THEN
    SELECT name INTO rname FROM rooms WHERE id = NEW.room_id;
    UPDATE orders o SET booking_id = NEW.id
    WHERE o.booking_id IS NULL
      AND o.created_at::date BETWEEN NEW.check_in AND NEW.check_out
      AND ((o.source_type = 'room' AND o.source_id IN (NEW.room_id::text, rname))
           OR (NEW.user_id IS NOT NULL AND o.user_id = NEW.user_id));
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.link_orders_on_checkin() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS link_orders_on_checkin ON public.bookings;
CREATE TRIGGER link_orders_on_checkin AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.link_orders_on_checkin();

UPDATE public.orders o SET booking_id = b.id
FROM public.bookings b JOIN public.rooms r ON r.id = b.room_id
WHERE o.booking_id IS NULL AND b.status IN ('checked_in','completed')
  AND o.created_at::date BETWEEN b.check_in AND b.check_out
  AND ((o.source_type = 'room' AND o.source_id IN (b.room_id::text, r.name))
       OR (b.user_id IS NOT NULL AND o.user_id = b.user_id));