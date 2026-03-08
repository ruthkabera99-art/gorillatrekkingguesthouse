
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only decrease if product has stock > 0 (0 means unlimited)
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id
    AND stock > 0;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrease_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_order();
