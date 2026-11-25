DROP POLICY "stores public read" ON public.stores;
CREATE POLICY "stores owner read" ON public.stores FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_store_by_slug(_slug text)
RETURNS TABLE (
  id uuid, slug text, name text, description text, whatsapp text, logo_url text, cover_url text,
  brand_color text, currency_symbol text, currency_code text, min_order numeric, timezone text,
  opening_hours jsonb, instagram text, tiktok text, facebook text, website text, returns_url text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.slug, s.name, s.description, s.whatsapp, s.logo_url, s.cover_url, s.brand_color,
         s.currency_symbol, s.currency_code, s.min_order, s.timezone, s.opening_hours,
         s.instagram, s.tiktok, s.facebook, s.website, s.returns_url, s.created_at
  FROM public.stores s WHERE s.slug = _slug LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_store_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_by_slug(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_public_image(_path text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.products WHERE active AND _path = ANY(images))
      OR EXISTS (SELECT 1 FROM public.stores WHERE logo_url = _path OR cover_url = _path)
$$;
REVOKE ALL ON FUNCTION public.is_public_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_image(text) TO anon, authenticated;

DROP POLICY "img public read" ON storage.objects;
CREATE POLICY "img owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "img published read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND public.is_public_image(name));