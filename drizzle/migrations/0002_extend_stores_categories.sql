ALTER TABLE public.stores
  ADD COLUMN currency_symbol text NOT NULL DEFAULT '$',
  ADD COLUMN currency_code text NOT NULL DEFAULT 'USD',
  ADD COLUMN cover_url text,
  ADD COLUMN brand_color text,
  ADD COLUMN min_order numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN timezone text NOT NULL DEFAULT 'America/Guayaquil',
  ADD COLUMN opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN instagram text,
  ADD COLUMN tiktok text,
  ADD COLUMN facebook text,
  ADD COLUMN website text,
  ADD COLUMN returns_url text;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX categories_store_id_idx ON public.categories(store_id);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories owner insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.owns_store(store_id));
CREATE POLICY "categories owner update" ON public.categories FOR UPDATE TO authenticated USING (public.owns_store(store_id)) WITH CHECK (public.owns_store(store_id));
CREATE POLICY "categories owner delete" ON public.categories FOR DELETE TO authenticated USING (public.owns_store(store_id));

ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX products_category_id_idx ON public.products(category_id);