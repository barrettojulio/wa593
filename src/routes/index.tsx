import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Clock,
  Images,
  Link2,
  MessageCircle,
  Package,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Cuando tengas una tienda de ejemplo lista, pon aquí su enlace (ej: "mi-tienda-demo")
// y aparecerá el botón "Ver tienda de ejemplo". Si lo dejas vacío, el botón no se muestra.
const DEMO_STORE_SLUG = "";

const TITLE = "Pedilisto — Crea tu tienda y recibe pedidos por WhatsApp";
const DESCRIPTION =
  "Sube tus productos con fotos, tallas y colores. Tus clientes arman el carrito y el pedido te llega ya escrito a tu WhatsApp. Sin comisiones por venta.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: "Tu catálogo online con pedidos directo a WhatsApp. Sin comisiones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Package, t: "Sube tus productos", d: "Agrega fotos, precio y opciones como talla, color, tamaño o medidas." },
  { icon: ShoppingBag, t: "Tus clientes eligen", d: "Personalizan cada producto, lo agregan al carrito y llenan sus datos." },
  { icon: MessageCircle, t: "El pedido llega a tu WhatsApp", d: "Ya escrito y con el total. Lo confirmas y acuerdas el pago en el chat." },
];

const features = [
  { icon: Package, t: "Opciones con precio extra", d: "Talla, color, tamaño o lo que necesites. Cada opción puede sumar al precio base." },
  { icon: Images, t: "Varias fotos por producto", d: "Tus clientes ven cada detalle antes de pedir, y tú respondes menos preguntas." },
  { icon: MessageCircle, t: "Todo el pedido en un mensaje", d: "Productos, opciones, cantidades, total y datos del cliente. Nada se pierde en el chat." },
  { icon: Link2, t: "Un enlace con tu nombre", d: "Compártelo en tu bio de Instagram y TikTok, en tus estados y en tus chats." },
  { icon: Smartphone, t: "Sin app y sin cuentas", d: "Tus clientes piden desde el navegador de su celular. Solo necesitan WhatsApp." },
  { icon: Wallet, t: "Sin comisión por venta", d: "Tus clientes te pagan directo a ti. Pedilisto nunca toca tu dinero." },
];

const useCases = [
  { emoji: "👗", t: "Ropa y accesorios", d: "Tallas y colores en cada producto." },
  { emoji: "🍰", t: "Comida y repostería", d: "Tamaños, sabores y extras." },
  { emoji: "💄", t: "Belleza y cosméticos", d: "Tonos, presentaciones y combos." },
  { emoji: "🏺", t: "Artesanías", d: "Vende lo que haces sin armar un sitio web." },
  { emoji: "💐", t: "Flores y regalos", d: "Arreglos con tamaños y mensaje." },
  { emoji: "🧰", t: "Servicios con paquetes", d: "Publica tus planes como productos." },
];

const soon = ["Categorías", "Cupones de descuento", "Opciones de envío", "Pedidos guardados con estado", "QR descargable", "Analítica de ventas"];

const faqs = [
  {
    q: "¿Necesito un sitio web o saber de tecnología?",
    a: "No. Creas tu tienda desde el celular o el computador, subes tus productos y compartes tu enlace. No instalas ni alojas nada.",
  },
  {
    q: "¿Cómo me pagan mis clientes?",
    a: "Pedilisto no procesa pagos. Tu cliente te envía el pedido por WhatsApp y acuerdan el pago en el chat, como ya lo haces: efectivo, transferencia o un enlace de pago que tú mandes. Por eso no cobramos comisión por tus ventas.",
  },
  {
    q: "¿Mis clientes necesitan crear una cuenta o instalar algo?",
    a: "No. Abren tu enlace, arman su carrito y tocan enviar. Solo necesitan WhatsApp.",
  },
  {
    q: "¿Funciona con WhatsApp Business?",
    a: "Funciona con cualquier número de WhatsApp, normal o Business. Cada pedido abre un chat con el número que tú definas.",
  },
  {
    q: "¿Puedo usarlo si vendo fuera de Ecuador?",
    a: "Sí. Al configurar tu tienda eliges el país de tu número de WhatsApp. Por ahora los precios se muestran en dólares ($).",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "$9,99 al mes por tienda, con pedidos ilimitados y sin comisión por tus ventas.",
  },
  {
    q: "¿Cómo comparto mi tienda?",
    a: "Tu tienda tiene su propio enlace con el nombre de tu negocio. Ponlo en tu bio de Instagram y TikTok, en tus estados de WhatsApp y en tus mensajes.",
  },
];

const priceIncludes = [
  "Pedidos y clientes ilimitados",
  "0% de comisión por tus ventas",
  "Productos con fotos, tallas, colores y opciones",
  "Tu enlace propio para compartir",
  "WhatsApp de cualquier país",
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-2xl font-extrabold">
          Pedi<span className="text-primary">listo</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#como-funciona" className="hover:text-primary">Cómo funciona</a>
          <a href="#funciones" className="hover:text-primary">Funciones</a>
          <a href="#precios" className="hover:text-primary">Precio</a>
          <a href="#preguntas" className="hover:text-primary">Preguntas</a>
        </nav>
        <Button asChild variant="ink" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:items-center md:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-brand-ink bg-accent px-3 py-1 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Sin comisión por tus ventas
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] md:text-7xl">
            Tu tienda online. <span className="text-primary">Pedidos por WhatsApp.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Sube tus productos con fotos, tallas y colores. Tus clientes arman el carrito y el pedido te llega ya escrito a tu WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/auth">
                Crear mi tienda <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {DEMO_STORE_SLUG ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/t/$slug" params={{ slug: DEMO_STORE_SLUG }}>Ver tienda de ejemplo</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg">
                <a href="#como-funciona">Ver cómo funciona</a>
              </Button>
            )}
          </div>
          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            {["Pedidos ilimitados", "Tus clientes no necesitan cuenta ni app", "Funciona con cualquier número de WhatsApp"].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="rotate-2 rounded-3xl border-2 border-brand-ink bg-card p-5 shadow-pop">
            <div className="rounded-2xl bg-brand-ink p-5 font-mono text-sm text-brand-ink-foreground">
              <p className="font-bold">*Nuevo pedido — Moda Cuenca*</p>
              <p className="mt-3">1. Camiseta básica x2 — $24.00</p>
              <p className="opacity-70">&nbsp;&nbsp; • Talla: M</p>
              <p className="opacity-70">&nbsp;&nbsp; • Color: Naranja</p>
              <p className="mt-2">2. Gorra x1 — $8.00</p>
              <p className="mt-3 font-bold text-primary">*Total: $32.00*</p>
              <p className="mt-3 opacity-70">Cliente: Ana Torres</p>
            </div>
          </div>
        </div>
      </section>

      {/* Antes / después */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold md:text-4xl">De un chat lleno de preguntas a un solo pedido claro.</h2>
          <p className="mt-3 text-muted-foreground">
            Vender por chat funciona hasta que los mensajes se acumulan. Con una tienda, tus clientes ven productos, precios y opciones antes de escribirte.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pedidos solo por chat</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="w-fit rounded-2xl bg-muted px-3 py-2">¿Tienen la camiseta en talla M?</p>
              <p className="ml-auto w-fit rounded-2xl bg-accent px-3 py-2">Sí, cuesta $12. ¿Qué color?</p>
              <p className="w-fit rounded-2xl bg-muted px-3 py-2">¿Y en naranja? ¿Hacen entregas?</p>
              <p className="ml-auto w-fit rounded-2xl bg-accent px-3 py-2">Sí. ¿Me pasas tu dirección?</p>
            </div>
            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              <li>• Respondes las mismas preguntas todo el día.</li>
              <li>• El pedido queda repartido en muchos mensajes.</li>
              <li>• Se pierden detalles: la talla, el color, el total.</li>
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-brand-ink bg-card p-6 shadow-pop-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Con tu tienda en Pedilisto</p>
            <div className="mt-4 rounded-2xl bg-brand-ink p-4 font-mono text-sm text-brand-ink-foreground">
              <p className="font-bold">*Nuevo pedido — Moda Cuenca*</p>
              <p className="mt-2">1. Camiseta básica x1 — $12.00</p>
              <p className="opacity-70">&nbsp;&nbsp; • Talla: M · Color: Naranja</p>
              <p className="mt-2 font-bold text-primary">*Total: $12.00*</p>
            </div>
            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Tus clientes ven fotos, precios y opciones por su cuenta.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Cada pedido llega en un solo mensaje, ya escrito.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Tú solo confirmas y cierras la venta.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-4 border-y-2 border-brand-ink bg-brand-ink text-brand-ink-foreground">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">Cómo funciona</h2>
          <p className="mt-2 max-w-xl opacity-75">Tres pasos y tu tienda está lista para recibir pedidos.</p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
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
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">Todo lo que necesitas para vender por WhatsApp</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border-2 border-brand-ink bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Clock className="h-4 w-4 text-primary" /> Próximamente:
          </span>
          {soon.map((x) => (
            <span key={x} className="rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">
              {x}
            </span>
          ))}
        </div>
      </section>

      {/* Casos de uso */}
      <section className="border-y-2 border-brand-ink bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">Una tienda para lo que vendes</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Si tus clientes ya te preguntan precios y te piden por chat, una tienda les da el catálogo a ellos y a ti el pedido completo.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <div key={u.t} className="flex items-start gap-4 rounded-2xl border-2 border-brand-ink bg-card p-4">
                <span className="text-3xl" aria-hidden="true">{u.emoji}</span>
                <div>
                  <h3 className="font-bold">{u.t}</h3>
                  <p className="text-sm text-muted-foreground">{u.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section id="precios" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">Un solo precio</h2>
          <p className="mt-2 text-muted-foreground">Sin niveles, sin sorpresas y sin comisión por tus ventas.</p>
        </div>
        <div className="mx-auto mt-8 max-w-md rounded-3xl border-2 border-brand-ink bg-card p-7 shadow-pop">
          <p className="font-display text-5xl font-extrabold">
            $9,99 <span className="text-lg font-medium text-muted-foreground">/ mes por tienda</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {priceIncludes.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {x}
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" size="lg" className="mt-7 w-full">
            <Link to="/auth">Crear mi tienda</Link>
          </Button>
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-4 px-5 pb-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border-2 border-brand-ink bg-brand-ink p-8 text-center text-brand-ink-foreground md:p-12">
          <h2 className="text-3xl font-extrabold md:text-4xl">Abre tu tienda hoy y recibe tu primer pedido por WhatsApp.</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-75">Crea tu catálogo en minutos y comparte un solo enlace.</p>
          <Button asChild variant="hero" size="lg" className="mt-7">
            <Link to="/auth">
              Crear mi tienda <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
        <span>© Pedilisto</span>
        <div className="flex gap-5">
          <Link to="/auth" className="hover:text-foreground">Entrar</Link>
          <a href="#precios" className="hover:text-foreground">Precio</a>
          <a href="#preguntas" className="hover:text-foreground">Preguntas</a>
        </div>
      </footer>
    </div>
  );
}