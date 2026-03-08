
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When an order item status changes to 'cancelled', restore stock
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products
    SET stock = stock + NEW.quantity
    WHERE id = NEW.product_id
      AND stock > 0;  -- only restore if product tracks stock (0 = unlimited)
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancel
AFTER UPDATE OF status ON public.order_items
FOR EACH ROW
WHEN (NEW.status = 'cancelled' AND OLD.status <> 'cancelled')
EXECUTE FUNCTION public.restore_stock_on_cancel();
