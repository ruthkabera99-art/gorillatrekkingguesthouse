CREATE OR REPLACE FUNCTION public.enforce_order_integrity()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
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
  -- Allow totals written by the recalc trigger (nested call), block direct edits
  IF pg_trigger_depth() <= 1 THEN
    NEW.total := OLD.total;
  END IF;
  NEW.source_type := OLD.source_type;
  NEW.user_id := OLD.user_id;
  IF auth.uid() IS NOT NULL AND private.has_role(auth.uid(), 'waiter') THEN
    IF OLD.assigned_waiter_id IS NULL THEN NEW.assigned_waiter_id := auth.uid();
    ELSE NEW.assigned_waiter_id := OLD.assigned_waiter_id; END IF;
  END IF;
  RETURN NEW;
END $function$;
UPDATE public.orders o SET total = COALESCE((SELECT SUM(quantity*unit_price) FROM public.order_items i WHERE i.order_id=o.id AND i.status<>'cancelled'),0);