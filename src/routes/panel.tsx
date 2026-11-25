import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { signPaths } from "@/lib/images";
import { money, type ProductOption } from "@/lib/order";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreForm, type Store } from "@/components/shop/StoreForm";
import { CategoriesManager, useCategories } from "@/components/shop/CategoriesManager";
import { ProductEditor, emptyProduct, type ProductRow } from "@/components/shop/ProductEditor";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Mi panel — Pedilisto" },
      { name: "description", content: "Administra tu tienda y tus productos." },
      { property: "og:title", content: "Mi panel — Pedilisto" },
      { property: "og:description", content: "Administra tu tienda y tus productos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});


function Panel() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const storeQ = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Store | null;
    },
  });

  if (loading || !user || storeQ.isLoading) return <div className="p-10 text-center text-muted-foreground">Cargando…</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-brand-ink bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl font-extrabold">
            Pedi<span className="text-primary">listo</span>
          </Link>
          <div className="flex items-center gap-2">
            {storeQ.data && (
              <Button asChild size="sm" variant="outline">
                <Link to="/t/$slug" params={{ slug: storeQ.data.slug }} target="_blank">
                  <ExternalLink className="h-4 w-4" /> Ver tienda
                </Link>
              </Button>
            )}
            <Button size="icon" variant="ghost" aria-label="Salir" onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        {storeQ.data ? <StoreAdmin store={storeQ.data} userId={user.id} /> : <StoreForm userId={user.id} />}
      </main>
    </div>
  );
}

function StoreAdmin({ store, userId }: { store: Store; userId: string }) {
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const cats = useCategories(store.id).data ?? [];
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name;
  const productsQ = useQuery({
    queryKey: ["my-products", store.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
      if (error) throw error;
      const urls = await signPaths(data.flatMap((p) => p.images));
      return { products: data, urls };
    },
  });

  async function remove(id: string): Promise<void> {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    productsQ.refetch();
  }

  const list = productsQ.data?.products ?? [];
  return (
    <Tabs defaultValue="productos">
      <TabsList>
        <TabsTrigger value="productos">Productos</TabsTrigger>
        <TabsTrigger value="categorias">Categorías</TabsTrigger>
        <TabsTrigger value="tienda">Tienda</TabsTrigger>
      </TabsList>
      <TabsContent value="productos" className="mt-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <Button variant="hero" onClick={() => setEditing(emptyProduct)}>
            <Plus className="h-4 w-4" /> Producto
          </Button>
        </div>
        {list.length === 0 && !productsQ.isLoading && (
          <div className="rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground">Aún no tienes productos. ¡Sube el primero!</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border-2 border-brand-ink bg-card">
              <div className="aspect-square bg-muted">
                {p.images[0] && <img src={productsQ.data?.urls[p.images[0]]} alt={p.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {money(Number(p.price))} {catName(p.category_id) && `· ${catName(p.category_id)}`} {!p.active && "· Oculto"}
                  </p>
                </div>
                <div className="flex">
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditing({ ...p, price: Number(p.price), options: p.options as unknown as ProductOption[] })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {editing && (
          <ProductEditor
            key={editing.id ?? "new"}
            open
            onOpenChange={(o) => !o && setEditing(null)}
            initial={editing}
            storeId={store.id}
            userId={userId}
            urls={productsQ.data?.urls ?? {}}
            categories={cats}
            onSaved={() => productsQ.refetch()}
          />
        )}
      </TabsContent>
      <TabsContent value="categorias" className="mt-6">
        <CategoriesManager storeId={store.id} />
      </TabsContent>
      <TabsContent value="tienda" className="mt-6">
        <StoreForm userId={userId} store={store} />
      </TabsContent>
    </Tabs>
  );
}
