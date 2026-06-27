
-- 1) Addresses
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  type text NOT NULL DEFAULT 'shipping' CHECK (type IN ('shipping','billing')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own addresses" ON public.addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own addresses" ON public.addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own addresses" ON public.addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own addresses" ON public.addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE DEFAULT ('DOR-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*100000)::text, 5, '0')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','refunded')),
  payment_method text NOT NULL CHECK (payment_method IN ('cod','online','upi','whatsapp')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  currency text NOT NULL DEFAULT 'INR',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  coupon_code text,
  ship_full_name text NOT NULL,
  ship_phone text NOT NULL,
  ship_email text,
  ship_line1 text NOT NULL,
  ship_line2 text,
  ship_city text NOT NULL,
  ship_state text,
  ship_postal_code text NOT NULL,
  ship_country text NOT NULL DEFAULT 'India',
  notes text,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- 3) Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  image text,
  size text,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins view all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert items into own orders" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
