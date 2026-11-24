import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Package, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pedilisto — Crea tu tienda y vende por WhatsApp" },
      { name: "description", content: "Sube tus productos con tallas y colores. Tus clientes arman el carrito y el pedido te llega por WhatsApp." },
      { property: "og:title", content: "Pedilisto — Crea tu tienda y vende por WhatsApp" },
      { property: "og:description", content: "Tu catálogo online con pedidos directo a WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Package, t: "Sube tus productos", d: "Fotos, precio y opciones: talla, color, tamaño, medidas." },
  { icon: ShoppingBag, t: "Tus clientes eligen", d: "Personalizan cada producto y lo agregan al carrito." },
  { icon: MessageCircle, t: "Te llega por WhatsApp", d: "El pedido completo, listo para confirmar." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-2xl font-extrabold">
          Pedi<span className="text-primary">listo</span>
        </Link>
        <Button asChild variant="ink" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand-ink bg-accent px-3 py-1 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Desde $9,99 al mes
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] md:text-7xl">
            Tu tienda online. <span className="text-primary">Pedidos por WhatsApp.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Crea tu catálogo en minutos y comparte un solo enlace. Sin comisiones por venta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/auth">Crear mi tienda</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="rotate-2 rounded-3xl border-2 border-brand-ink bg-card p-5 shadow-pop">
            <div className="rounded-2xl bg-brand-ink p-5 font-mono text-sm text-brand-ink-foreground">
              <p className="font-bold">*Nuevo pedido — Moda Quito*</p>
              <p className="mt-3">1. Camiseta básica x2 — $24.00</p>
              <p className="opacity-70">&nbsp;&nbsp; • Talla: M</p>
              <p className="opacity-70">&nbsp;&nbsp; • Color: Naranja</p>
              <p className="mt-2">2. Gorra x1 — $8.00</p>
              <p className="mt-3 font-bold text-primary">*Total: $32.00*</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-brand-ink bg-brand-ink text-brand-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {i + 1}. {s.t}
              </h3>
              <p className="mt-1 opacity-75">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">© Pedilisto</footer>
    </div>
  );
}
