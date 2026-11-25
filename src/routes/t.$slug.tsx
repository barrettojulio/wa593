import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signPaths } from "@/lib/images";
import { buildOrderMessage, cartTotal, itemKey, money, unitPrice, whatsappLink, type CartItem, type ProductOption } from "@/lib/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

type Product = { id: string; name: string; description: string; price: number; images: string[]; options: unknown; category_id: string | null };

function StorePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storeQuery(slug));
  const { store, products, urls, categories } = data!;
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? products.filter((p) => p.category_id === cat) : products;
  const usedCats = categories.filter((c) => products.some((p) => p.category_id === c.id));
  const minOrder = Number(store.min_order) || 0;
  const socials = ([["Instagram", store.instagram], ["TikTok", store.tiktok], ["Facebook", store.facebook], ["Sitio web", store.website], ["Devoluciones", store.returns_url]] as const).filter(([, u]) => u);
  const cartKey = `cart-${store.id}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem(cartKey) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, [cartKey]);
  useEffect(() => { if (ready) localStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, ready, cartKey]);

  function add(item: CartItem) {
    setCart((c) => {
      const ex = c.find((x) => x.key === item.key);
      return ex ? c.map((x) => (x.key === item.key ? { ...x, quantity: x.quantity + item.quantity } : x)) : [...c, item];
    });
  }
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  return (
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
                {socials.map(([l, u]) => <a key={l} href={u!} target="_blank" rel="noreferrer" className="underline underline-offset-4">{l}</a>)}
              </div>
            )}
          </div>
        </div>
      </header>
      {usedCats.length > 0 && (
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-5 pt-6">
          {[{ id: null as string | null, name: "Todo" }, ...usedCats].map((c) => (
            <button key={c.id ?? "all"} type="button" onClick={() => setCat(c.id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${cat === c.id ? "border-brand-ink bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              {c.name}
            </button>
          ))}
        </nav>
      )}
      <main className="mx-auto grid max-w-5xl gap-4 px-5 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 && <p className="text-muted-foreground">Esta tienda aún no tiene productos.</p>}
        {shown.map((p) => (
          <button key={p.id} type="button" onClick={() => setSelected(p)} className="overflow-hidden rounded-2xl border-2 border-brand-ink bg-card text-left transition hover:shadow-pop-sm">
            <div className="aspect-square bg-muted">{p.images[0] && <img src={urls[p.images[0]]} alt={p.name} className="h-full w-full object-cover" />}</div>
            <div className="p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="font-display text-lg font-bold text-primary">{money(Number(p.price))}</p>
            </div>
          </button>
        ))}
      </main>
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center px-5">
          <Button variant="hero" size="lg" onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-5 w-5" /> Ver carrito ({count}) · {money(cartTotal(cart))}
          </Button>
        </div>
      )}
      {selected && <ProductDialog product={selected} urls={urls} onClose={() => setSelected(null)} onAdd={(i) => { add(i); setSelected(null); }} />}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} setCart={setCart} storeName={store.name} whatsapp={store.whatsapp} minOrder={minOrder} />
    </div>
  );
}

function ProductDialog({ product, urls, onClose, onAdd }: { product: Product; urls: Record<string, string>; onClose: () => void; onAdd: (i: CartItem) => void }) {
  const options = (product.options as ProductOption[]) ?? [];
  const [picks, setPicks] = useState<Record<string, number>>(() => Object.fromEntries(options.map((o) => [o.name, 0])));
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const selections = options.map((o) => { const v = o.values[picks[o.name] ?? 0]!; return { option: o.name, value: v.label, price: Number(v.price) || 0 }; });
  const base = Number(product.price);
  const unit = unitPrice({ basePrice: base, selections });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        {product.images.length > 0 && (
          <div>
            <img src={urls[product.images[img]!]} alt={product.name} className="aspect-square w-full rounded-xl object-cover" />
            {product.images.length > 1 && (
              <div className="mt-2 flex gap-2">
                {product.images.map((p, i) => (
                  <button key={p} type="button" onClick={() => setImg(i)} className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${i === img ? "border-primary" : "border-transparent"}`}>
                    <img src={urls[p]} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {product.description && <p className="text-muted-foreground">{product.description}</p>}
        {options.map((o) => (
          <div key={o.name}>
            <p className="mb-2 text-sm font-semibold">{o.name}</p>
            <div className="flex flex-wrap gap-2">
              {o.values.map((v, i) => (
                <button key={v.label} type="button" onClick={() => setPicks({ ...picks, [o.name]: i })}
                  className={`rounded-full border-2 px-3 py-1 text-sm ${picks[o.name] === i ? "border-brand-ink bg-primary text-primary-foreground" : "border-border"}`}>
                  {v.label}{Number(v.price) ? ` +${money(Number(v.price))}` : ""}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Menos" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <Button size="icon" variant="outline" aria-label="Más" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button variant="hero" onClick={() => onAdd({ key: itemKey(product.id, selections), productId: product.id, name: product.name, basePrice: base, selections, quantity: qty })}>
            Agregar · {money(unit * qty)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartSheet({ open, onOpenChange, cart, setCart, storeName, whatsapp, minOrder }: { minOrder: number; open: boolean; onOpenChange: (o: boolean) => void; cart: CartItem[]; setCart: (c: CartItem[]) => void; storeName: string; whatsapp: string }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const send = () => {
    window.open(whatsappLink(whatsapp, buildOrderMessage(storeName, cart, { name, address, notes })), "_blank");
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
                <p className="text-sm">{money(unitPrice(i) * i.quantity)}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Quitar" onClick={() => setCart(cart.filter((x) => x.key !== i.key))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <p className="font-display text-xl font-bold">Total: {money(cartTotal(cart))}</p>
          <div className="space-y-1.5"><Label>Tu nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Dirección de entrega</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {cartTotal(cart) < minOrder && <p className="text-sm text-destructive">El pedido mínimo es {money(minOrder)}.</p>}
          <Button variant="hero" className="w-full" disabled={!name.trim() || cart.length === 0 || cartTotal(cart) < minOrder} onClick={send}>Enviar pedido por WhatsApp</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
