import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, MessageCircle, Minus, Package, Plus, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/images";
import {
  buildOrderMessage,
  cartTotal,
  itemKey,
  money,
  unitPrice,
  whatsappDigits,
  whatsappLink,
  type CartItem,
  type ProductOption,
} from "@/lib/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const storeQuery = (slug: string) =>
  queryOptions({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("get_store_by_slug", { _slug: slug });
      if (error) throw error;
      const store = rows?.[0];
      if (!store) return null;
      const { data: products, error: e2 } = await supabase.from("products").select("*").eq("store_id", store.id).eq("active", true).order("created_at", { ascending: false });
      if (e2) throw e2;
      const { data: categories } = await supabase.from("categories").select("id,name,position").eq("store_id", store.id).order("position");
      const urls = await signPaths([...products.flatMap((p) => p.images), store.logo_url ?? "", store.cover_url ?? ""]);
      return { store, products, urls, categories: categories ?? [] };
    },
  });

export const Route = createFileRoute("/t/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(storeQuery(params.slug));
    if (!d) throw notFound();
    return { name: d.store.name, description: d.store.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Tienda"} — Pedilisto` },
      { name: "description", content: loaderData?.description || "Haz tu pedido por WhatsApp." },
      { property: "og:title", content: loaderData?.name ?? "Tienda" },
      { property: "og:description", content: loaderData?.description || "Haz tu pedido por WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorePage,
});

// Símbolo de moneda de la tienda (se configura en el panel). Lo leen el producto y el carrito.
const CurrencyContext = createContext("$");

// Campos opcionales: se muestran solo si existen en la base de datos y el producto los tiene.
type Detail = { title: string; body: string };
type Extras = { compare_at_price?: number | null; sku?: string | null; details?: unknown };
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  options: unknown;
  category_id: string | null;
} & Extras;

function parseDetails(v: unknown): Detail[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x: unknown) => {
    if (x && typeof x === "object") {
      const o = x as { title?: unknown; body?: unknown };
      const title = typeof o.title === "string" ? o.title.trim() : "";
      const body = typeof o.body === "string" ? o.body.trim() : "";
      if (title && body) return [{ title, body }];
    }
    return [];
  });
}

const COLOR_MAP: Record<string, string> = {
  negro: "#111111", blanco: "#ffffff", gris: "#9ca3af", rojo: "#dc2626", azul: "#2563eb",
  "azul marino": "#1e3a8a", verde: "#16a34a", amarillo: "#facc15", naranja: "#f97316",
  rosado: "#f472b6", rosa: "#f472b6", morado: "#7c3aed", lila: "#c4b5fd", café: "#7c4a2d",
  cafe: "#7c4a2d", beige: "#d6c3a1", celeste: "#38bdf8", turquesa: "#14b8a6", vino: "#7f1d1d",
  dorado: "#d4af37", plateado: "#c0c0c0",
};

// Los enlaces los escribe el vendedor: solo se aceptan http(s) para evitar enlaces peligrosos (javascript:).
function isHttpUrl(u: string | null | undefined): u is string {
  return !!u && /^https?:\/\//i.test(u);
}

function swatchColor(label: string) {
  return COLOR_MAP[label.trim().toLowerCase()];
}

function readableOn(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

function WhatsAppFab({ whatsapp, text, className }: { whatsapp: string; text: string; className?: string }) {
  return (
    <a
      href={`https://wa.me/${whatsappDigits(whatsapp)}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      className={`fixed left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 ${className ?? "bottom-4"}`}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

function StorePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storeQuery(slug));
  const { store, products, urls, categories } = data ?? { store: null, products: [], urls: {}, categories: [] };
  const symbol = store?.currency_symbol || "$";
  const fmt = (n: number) => money(n, symbol);
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? products.filter((p) => p.category_id === cat) : products;
  const usedCats = categories.filter((c) => products.some((p) => p.category_id === c.id));
  const minOrder = Number(store?.min_order) || 0;
  const socials = ([["Instagram", store?.instagram], ["TikTok", store?.tiktok], ["Facebook", store?.facebook], ["Sitio web", store?.website], ["Devoluciones", store?.returns_url]] as const).filter(([, u]) => u && isHttpUrl(u));
  const cartKey = `cart-${store?.id ?? slug}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const openedFromList = useRef(false);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem(cartKey) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, [cartKey]);
  useEffect(() => { if (ready) localStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, ready, cartKey]);

  // El producto abierto vive en el enlace (#p=ID): se puede compartir y el botón "atrás" del celular funciona.
  useEffect(() => {
    const read = () => {
      const m = /^#p=(.+)$/.exec(window.location.hash);
      setSelectedId(m ? decodeURIComponent(m[1]!) : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [selectedId]);

  function openProduct(id: string) {
    openedFromList.current = true;
    window.location.hash = `p=${encodeURIComponent(id)}`;
  }
  function closeProduct() {
    if (openedFromList.current) {
      openedFromList.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setSelectedId(null);
    }
  }

  function add(item: CartItem) {
    setCart((c) => {
      const ex = c.find((x) => x.key === item.key);
      return ex ? c.map((x) => (x.key === item.key ? { ...x, quantity: x.quantity + item.quantity } : x)) : [...c, item];
    });
  }
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  if (!store) return null;
  const selected: Product | null = selectedId ? (products.find((p) => p.id === selectedId) ?? null) : null;

  if (selected) {
    return (
      <CurrencyContext.Provider value={symbol}>
        <ProductView
          key={selected.id}
          product={selected}
          products={products}
          categories={categories}
          urls={urls}
          store={{
            name: store.name,
            logo: store.logo_url ? urls[store.logo_url] : undefined,
            whatsapp: store.whatsapp,
            minOrder,
            returnsUrl: isHttpUrl(store.returns_url) ? store.returns_url : null,
            brand: store.brand_color || "#111111",
          }}
          cartCount={count}
          onBack={closeProduct}
          onOpenCart={() => setCartOpen(true)}
          onAdd={(items) => { items.forEach(add); setCartOpen(true); }}
        />
        <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} setCart={setCart} storeName={store.name} whatsapp={store.whatsapp} minOrder={minOrder} />
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={symbol}>
    <div className="min-h-screen pb-24">
      <header className="relative border-b-2 border-brand-ink bg-brand-ink text-brand-ink-foreground">
        {store.cover_url && urls[store.cover_url] && <img src={urls[store.cover_url]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="relative mx-auto flex max-w-5xl items-center gap-5 px-5 py-10">
          {store.logo_url && urls[store.logo_url] && <img src={urls[store.logo_url]} alt={`Logo de ${store.name}`} className="h-20 w-20 rounded-2xl border-2 border-background object-cover" />}
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{store.name}</h1>
            {store.description && <p className="mt-2 max-w-xl opacity-80">{store.description}</p>}
            {socials.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {socials.map(([l, u]) => <a key={l} href={u ?? undefined} target="_blank" rel="noreferrer" className="underline underline-offset-4">{l}</a>)}
              </div>
            )}
          </div>
        </div>
      </header>
      {usedCats.length > 0 && (
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-5 pt-6">
          {[{ id: null as string | null, name: "Todo" }, ...usedCats].map((c) => (
            <Button key={c.id ?? "all"} type="button" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)}>
              {c.name}
            </Button>
          ))}
        </nav>
      )}
      <main className="mx-auto grid max-w-5xl gap-4 px-5 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 && <p className="text-muted-foreground">Esta tienda aún no tiene productos.</p>}
        {shown.map((p) => {
          const pr: Product = p;
          const compare = Number(pr.compare_at_price) || 0;
          return (
            <button key={p.id} type="button" onClick={() => openProduct(p.id)} className="overflow-hidden rounded-2xl border-2 border-brand-ink bg-card text-left transition hover:shadow-pop-sm">
              <div className="aspect-square bg-muted">{p.images[0] && <img src={urls[p.images[0]]} alt={p.name} className="h-full w-full object-cover" />}</div>
              <div className="p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="font-display text-lg font-bold text-primary">
                  {fmt(Number(p.price))}
                  {compare > Number(p.price) && <span className="ml-2 text-sm font-normal text-muted-foreground line-through">{fmt(compare)}</span>}
                </p>
              </div>
            </button>
          );
        })}
      </main>
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center px-5">
          <Button variant="hero" size="lg" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-5 w-5" /> Ver carrito ({count}) · {fmt(cartTotal(cart))}
          </Button>
        </div>
      )}
      <WhatsAppFab whatsapp={store.whatsapp} text={`Hola, vi tu tienda ${store.name} y tengo una pregunta.`} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} setCart={setCart} storeName={store.name} whatsapp={store.whatsapp} minOrder={minOrder} />
    </div>
    </CurrencyContext.Provider>
  );
}

type StoreInfo = { name: string; logo?: string | undefined; whatsapp: string; minOrder: number; returnsUrl: string | null; brand: string };

function ProductView({
  product, products, categories, urls, store, cartCount, onBack, onOpenCart, onAdd,
}: {
  product: Product;
  products: Product[];
  categories: { id: string; name: string }[];
  urls: Record<string, string>;
  store: StoreInfo;
  cartCount: number;
  onBack: () => void;
  onOpenCart: () => void;
  onAdd: (items: CartItem[]) => void;
}) {
  const symbol = useContext(CurrencyContext);
  const fmt = (n: number) => money(n, symbol);
  const options = (product.options as ProductOption[]) ?? [];
  const [picks, setPicks] = useState<Record<string, number>>(() => Object.fromEntries(options.map((o) => [o.name, 0])));
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [withExtra, setWithExtra] = useState(false);

  const selections = options.map((o) => { const v = o.values[picks[o.name] ?? 0]!; return { option: o.name, value: v.label, price: Number(v.price) || 0 }; });
  const base = Number(product.price);
  const unit = unitPrice({ basePrice: base, selections });
  const compare = Number(product.compare_at_price) || 0;
  const before = compare > base ? compare + (unit - base) : 0;
  const discount = before > 0 ? Math.round((1 - unit / before) * 100) : 0;
  const details = parseDetails(product.details);
  const category = categories.find((c) => c.id === product.category_id);
  const onBrand = readableOn(store.brand);

  // "Extra": sugiere otro producto de la tienda (primero de la misma categoría).
  const others = products.filter((p) => p.id !== product.id);
  const extra = others.find((p) => product.category_id && p.category_id === product.category_id) ?? others[0];
  const extraSelections = ((extra?.options as ProductOption[] | undefined) ?? []).map((o) => { const v = o.values[0]!; return { option: o.name, value: v.label, price: Number(v.price) || 0 }; });
  const extraPrice = extra ? unitPrice({ basePrice: Number(extra.price), selections: extraSelections }) : 0;

  function addToCart() {
    const items: CartItem[] = [{ key: itemKey(product.id, selections), productId: product.id, name: product.name, basePrice: base, selections, quantity: qty }];
    if (withExtra && extra) {
      items.push({ key: itemKey(extra.id, extraSelections), productId: extra.id, name: extra.name, basePrice: Number(extra.price), selections: extraSelections, quantity: 1 });
    }
    onAdd(items);
  }

  const imgUrl = (p?: string) => (p ? urls[p] : undefined);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <div className="flex items-center gap-2 font-display text-lg font-extrabold">
            {store.logo && <img src={store.logo} alt="" className="h-7 w-7 rounded-md object-cover" />}
            {store.name}
          </div>
          <button type="button" onClick={onOpenCart} aria-label="Ver carrito" className="relative p-1">
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold" style={{ backgroundColor: store.brand, color: onBrand }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <nav className="text-xs text-muted-foreground">
          <button type="button" onClick={onBack} className="hover:underline">Tienda</button>
          {category && <> / <span>{category.name}</span></>} / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Galería */}
          <div>
            <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
              {imgUrl(product.images[img]) && <img src={imgUrl(product.images[img])} alt={product.name} className="h-full w-full object-cover" />}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((p, i) => (
                  <button key={p} type="button" onClick={() => setImg(i)} aria-label={`Foto ${i + 1}`}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? "border-foreground" : "border-transparent opacity-70"}`}>
                    <img src={imgUrl(p)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div>
            <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{product.name}</h1>
            {product.sku && <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{product.sku}</p>}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-extrabold">{fmt(unit)}</span>
              {before > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">Antes: <span className="line-through">{fmt(before)}</span></span>
                  {discount > 0 && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: store.brand, color: onBrand }}>-{discount}%</span>}
                </>
              )}
            </div>

            {options.map((o) => {
              const isColor = /^colou?res?$/i.test(o.name.trim()) && o.values.every((v) => swatchColor(v.label));
              const current = o.values[picks[o.name] ?? 0];
              return (
                <div key={o.name} className="mt-6">
                  <p className="mb-2 text-sm">
                    {o.name} <span className="font-semibold">{current?.label}</span>
                    {current && Number(current.price) ? <span className="text-muted-foreground"> (+{fmt(Number(current.price))})</span> : null}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {o.values.map((v, i) => {
                      const active = picks[o.name] === i;
                      return isColor ? (
                        <button key={v.label} type="button" aria-label={v.label} title={v.label} onClick={() => setPicks({ ...picks, [o.name]: i })}
                          className={`h-9 w-9 rounded-full border-2 p-0.5 ${active ? "border-foreground" : "border-border"}`}>
                          <span className="block h-full w-full rounded-full border border-black/10" style={{ backgroundColor: swatchColor(v.label) }} />
                        </button>
                      ) : (
                        <button key={v.label} type="button" onClick={() => setPicks({ ...picks, [o.name]: i })}
                          className={`min-h-10 min-w-11 rounded-md border px-3 text-sm font-medium ${active ? "border-transparent" : "border-border bg-card hover:border-foreground"}`}
                          style={active ? { backgroundColor: store.brand, color: onBrand } : undefined}>
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {extra && (
              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3">
                <input type="checkbox" checked={withExtra} onChange={(e) => setWithExtra(e.target.checked)} className="h-4 w-4 shrink-0 accent-foreground" />
                {extra.images[0] && <img src={imgUrl(extra.images[0])} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
                <span className="text-sm">
                  <span className="font-semibold">Extra:</span> ¿Quieres añadir {extra.name} por solo <span className="font-semibold">{fmt(extraPrice)}</span>?
                </span>
              </label>
            )}

            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> Confirmas tu pedido y el pago directo por WhatsApp.</li>
              {store.minOrder > 0 && <li className="flex items-start gap-2"><Package className="mt-0.5 h-4 w-4 shrink-0" /> Pedido mínimo {fmt(store.minOrder)}.</li>}
              {store.returnsUrl && (
                <li className="flex items-start gap-2"><RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
                  <a href={store.returnsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Política de devoluciones</a>
                </li>
              )}
            </ul>

            {(product.description || details.length > 0) && (
              <Accordion type="multiple" defaultValue={["desc"]} className="mt-6 border-t">
                {product.description && (
                  <AccordionItem value="desc">
                    <AccordionTrigger className="text-base font-semibold">Descripción</AccordionTrigger>
                    <AccordionContent className="whitespace-pre-line text-muted-foreground">{product.description}</AccordionContent>
                  </AccordionItem>
                )}
                {details.map((d, i) => (
                  <AccordionItem key={d.title} value={`d-${i}`}>
                    <AccordionTrigger className="text-base font-semibold">{d.title}</AccordionTrigger>
                    <AccordionContent className="whitespace-pre-line text-muted-foreground">{d.body}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      {/* Barra fija: cantidad + agregar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex items-center rounded-full border">
            <button type="button" aria-label="Menos" onClick={() => setQty(Math.max(1, qty - 1))} className="p-3"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button type="button" aria-label="Más" onClick={() => setQty(qty + 1)} className="p-3"><Plus className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={addToCart} className="h-12 flex-1 rounded-full text-base font-bold" style={{ backgroundColor: store.brand, color: onBrand }}>
            Agregar al carrito · {fmt(unit * qty + (withExtra ? extraPrice : 0))}
          </button>
        </div>
      </div>
      <WhatsAppFab whatsapp={store.whatsapp} text={`Hola, me interesa "${product.name}" de ${store.name}.`} className="bottom-24" />
    </div>
  );
}

function CartSheet({ open, onOpenChange, cart, setCart, storeName, whatsapp, minOrder }: { minOrder: number; open: boolean; onOpenChange: (o: boolean) => void; cart: CartItem[]; setCart: (c: CartItem[]) => void; storeName: string; whatsapp: string }) {
  const symbol = useContext(CurrencyContext);
  const fmt = (n: number) => money(n, symbol);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const send = () => {
    window.open(whatsappLink(whatsapp, buildOrderMessage(storeName, cart, { name, address, notes }, symbol)), "_blank");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>Tu pedido</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3 px-4">
          {cart.map((i) => (
            <div key={i.key} className="flex items-start justify-between gap-2 border-b pb-3">
              <div>
                <p className="font-semibold">{i.name} x{i.quantity}</p>
                {i.selections.map((s) => <p key={s.option} className="text-xs text-muted-foreground">{s.option}: {s.value}</p>)}
                <p className="text-sm">{fmt(unitPrice(i) * i.quantity)}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Quitar" onClick={() => setCart(cart.filter((x) => x.key !== i.key))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <p className="font-display text-xl font-bold">Total: {fmt(cartTotal(cart))}</p>
          <div className="space-y-1.5"><Label>Tu nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Dirección de entrega</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {cartTotal(cart) < minOrder && <p className="text-sm text-destructive">El pedido mínimo es {fmt(minOrder)}.</p>}
          <Button variant="hero" className="w-full" disabled={!name.trim() || cart.length === 0 || cartTotal(cart) < minOrder} onClick={send}>Enviar pedido por WhatsApp</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}