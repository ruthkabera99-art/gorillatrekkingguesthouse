
-- Restaurant tables for walk-in customers
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available', -- available, occupied, reserved
  capacity INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Admins can manage tables" ON public.restaurant_tables FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products (menu items)
CREATE TYPE public.product_department AS ENUM ('kitchen', 'bar');
CREATE TYPE public.product_category AS ENUM ('appetizer', 'main_course', 'dessert', 'side', 'soft_drink', 'beer', 'wine', 'cocktail', 'spirit', 'hot_beverage');

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category product_category NOT NULL,
  department product_department NOT NULL,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TYPE public.order_source_type AS ENUM ('room', 'table');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE public.order_payment_status AS ENUM ('unpaid', 'paid', 'charged_to_room');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type order_source_type NOT NULL,
  source_id TEXT NOT NULL, -- room_number or table_id
  user_id UUID, -- nullable for walk-in guests
  status order_status NOT NULL DEFAULT 'pending',
  payment_status order_payment_status NOT NULL DEFAULT 'unpaid',
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can view orders by source" ON public.orders FOR SELECT TO anon USING (true);

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order items
CREATE TYPE public.order_item_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  note TEXT,
  status order_item_status NOT NULL DEFAULT 'pending',
  department product_department NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed restaurant tables
INSERT INTO public.restaurant_tables (table_number, capacity) VALUES
  (1, 2), (2, 4), (3, 4), (4, 6), (5, 4), (6, 2), (7, 8), (8, 4), (9, 4), (10, 6);

-- Seed menu products (prices in RWF)
INSERT INTO public.products (name, description, price, category, department) VALUES
  -- Kitchen items
  ('Brochettes de Chèvre', 'Grilled goat skewers with spiced sauce', 5000, 'main_course', 'kitchen'),
  ('Isombe', 'Cassava leaves with palm oil and peanuts', 3500, 'main_course', 'kitchen'),
  ('Ugali & Beans', 'Traditional cornmeal with mixed beans', 3000, 'main_course', 'kitchen'),
  ('Tilapia Grillé', 'Grilled Lake Kivu tilapia with plantain', 7000, 'main_course', 'kitchen'),
  ('Sambaza Frites', 'Fried small fish with chips', 4500, 'main_course', 'kitchen'),
  ('Fresh Garden Salad', 'Mixed greens with avocado and tomato', 2500, 'appetizer', 'kitchen'),
  ('Chips Mayai', 'Omelette with French fries', 3000, 'main_course', 'kitchen'),
  ('Banana Flambe', 'Caramelized banana dessert', 3500, 'dessert', 'kitchen'),
  ('Fruit Platter', 'Seasonal tropical fruits', 2000, 'dessert', 'kitchen'),
  ('Chapati & Stew', 'Flatbread with beef stew', 4000, 'main_course', 'kitchen'),
  -- Bar items
  ('Primus Beer', 'Local Rwandan lager', 1500, 'beer', 'bar'),
  ('Mutzig Beer', 'Premium local beer', 2000, 'beer', 'bar'),
  ('Inyange Juice', 'Local fruit juice', 1000, 'soft_drink', 'bar'),
  ('Fresh Passion Juice', 'Freshly squeezed passion fruit', 1500, 'soft_drink', 'bar'),
  ('Rwandan Coffee', 'Premium single-origin coffee', 2000, 'hot_beverage', 'bar'),
  ('Amarula Cocktail', 'Cream liqueur cocktail', 5000, 'cocktail', 'bar'),
  ('Gin & Tonic', 'Classic G&T', 4000, 'cocktail', 'bar'),
  ('House Red Wine', 'Glass of imported red wine', 5000, 'wine', 'bar'),
  ('Coca-Cola', 'Classic soft drink', 800, 'soft_drink', 'bar'),
  ('Water (500ml)', 'Still mineral water', 500, 'soft_drink', 'bar');
