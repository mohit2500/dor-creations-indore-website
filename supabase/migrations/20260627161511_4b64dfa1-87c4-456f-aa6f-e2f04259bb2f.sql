
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_price numeric,
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS country_of_origin text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS stock_qty integer,
  ADD COLUMN IF NOT EXISTS video_url text;
