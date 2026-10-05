CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_stock integer;
BEGIN
  SELECT stock INTO v_stock FROM public.products WHERE id = NEW.product_id FOR UPDATE;
  IF v_stock > 0 THEN
    IF NEW.quantity > v_stock THEN
      RAISE EXCEPTION 'Only % left in stock', v_stock;
    END IF;
    UPDATE public.products
       SET stock = stock - NEW.quantity,
           available = CASE WHEN stock - NEW.quantity <= 0 THEN false ELSE available END
     WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products
       SET stock = stock + NEW.quantity, available = true
     WHERE id = NEW.product_id AND (stock > 0 OR available = false);
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='order_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items; END IF;
END $$;