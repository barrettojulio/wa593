import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isValidPhoneNumber } from "libphonenumber-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { signPaths, uploadImage } from "@/lib/images";
import { slugify } from "@/lib/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PhoneInput, normalizePhone } from "@/components/shop/PhoneInput";

export type Store = Tables<"stores">;
export type DayHours = { open: boolean; from: string; to: string };
export const DAYS = [
  ["mon", "Lunes"], ["tue", "Martes"], ["wed", "Miércoles"], ["thu", "Jueves"],
  ["fri", "Viernes"], ["sat", "Sábado"], ["sun", "Domingo"],
] as const;
const defaultDay: DayHours = { open: true, from: "09:00", to: "18:00" };

export function StoreForm({ userId, store }: { userId: string; store?: Store }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: store?.name ?? "", slug: store?.slug ?? "", description: store?.description ?? "",
    whatsapp: normalizePhone(store?.whatsapp ?? ""),
    logo_url: store?.logo_url ?? null, cover_url: store?.cover_url ?? null,
    brand_color: store?.brand_color ?? "#f97316",
    currency_symbol: store?.currency_symbol ?? "$", currency_code: store?.currency_code ?? "USD",
    min_order: Number(store?.min_order ?? 0), timezone: store?.timezone ?? "America/Guayaquil",
    instagram: store?.instagram ?? "", tiktok: store?.tiktok ?? "", facebook: store?.facebook ?? "",
    website: store?.website ?? "", returns_url: store?.returns_url ?? "",
  });
  const [hoursChanged, setHoursChanged] = useState(false);
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const h = (store?.opening_hours ?? {}) as Record<string, DayHours>;
    return Object.fromEntries(DAYS.map(([k]) => [k, h[k] ?? defaultDay]));
  });
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    signPaths([f.logo_url, f.cover_url].filter(Boolean) as string[]).then((m) => setUrls((u) => ({ ...u, ...m }))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(kind: "logo_url" | "cover_url", file?: File) {
    if (!file) return;
    try {
      const path = await uploadImage(userId, file);
      setUrls((u) => ({ ...u, [path]: URL.createObjectURL(file) }));
      set(kind, path);
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo subir"); }
  }

  async function save(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const s = slugify(f.slug || f.name);
    if (!s) return void toast.error("Escribe un nombre");
    if (!isValidPhoneNumber(f.whatsapp)) return void toast.error("Escribe un número de WhatsApp válido");
    setBusy(true);
    const opt = (v: string) => v.trim() || null;
    const row = {
      ...f, slug: s, owner_id: userId, opening_hours: hoursChanged ? hours : store?.opening_hours ?? {}, min_order: Number(f.min_order) || 0,
      instagram: opt(f.instagram), tiktok: opt(f.tiktok), facebook: opt(f.facebook), website: opt(f.website), returns_url: opt(f.returns_url),
    };
    const { error } = store ? await supabase.from("stores").update(row).eq("id", store.id) : await supabase.from("stores").insert(row);
    setBusy(false);
    if (error) return void toast.error(error.code === "23505" ? "Ese enlace ya está en uso, prueba otro" : error.message);
    toast.success("Tienda guardada");
    qc.invalidateQueries({ queryKey: ["my-store"] });
  }

  const field = (label: string, k: "instagram" | "tiktok" | "facebook" | "website" | "returns_url", ph: string) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input placeholder={ph} value={f[k]} onChange={(e) => set(k, e.target.value)} /></div>
  );

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6 rounded-3xl border-2 border-brand-ink bg-card p-7 shadow-pop">
      <h1 className="text-2xl font-bold">{store ? "Datos de la tienda" : "Crea tu tienda"}</h1>
      <section className="space-y-4">
        <div className="space-y-1.5"><Label>Nombre de la tienda</Label>
          <Input required value={f.name} onChange={(e) => { set("name", e.target.value); if (!store) set("slug", slugify(e.target.value)); }} /></div>
        <div className="space-y-1.5"><Label>Enlace</Label>
          <div className="flex items-center gap-1 text-sm text-muted-foreground"><span>/t/</span><Input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></div></div>
        <div className="space-y-1.5"><Label>WhatsApp donde recibes pedidos</Label><PhoneInput value={f.whatsapp} onChange={(v) => set("whatsapp", v)} /></div>
        <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Imagen de la tienda</h2>
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center text-xs text-muted-foreground hover:border-primary">
            {f.logo_url && urls[f.logo_url] ? <img src={urls[f.logo_url]} alt="Logo" className="h-full w-full object-cover" /> : "Subir logo"}
            <input type="file" accept="image/*" hidden onChange={(e) => upload("logo_url", e.target.files?.[0])} />
          </label>
          <label className="flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-xs text-muted-foreground hover:border-primary">
            {f.cover_url && urls[f.cover_url] ? <img src={urls[f.cover_url]} alt="Portada" className="h-full w-full object-cover" /> : "Subir portada"}
            <input type="file" accept="image/*" hidden onChange={(e) => upload("cover_url", e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex items-center gap-3"><Label>Color de marca</Label>
          <input type="color" aria-label="Color de marca" value={f.brand_color} onChange={(e) => set("brand_color", e.target.value)} className="h-9 w-14 cursor-pointer rounded border" /></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Ventas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Símbolo de moneda</Label><Input value={f.currency_symbol} onChange={(e) => set("currency_symbol", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Código de moneda</Label><Input value={f.currency_code} onChange={(e) => set("currency_code", e.target.value.toUpperCase())} /></div>
          <div className="space-y-1.5"><Label>Pedido mínimo</Label><Input type="number" min={0} step="0.01" value={f.min_order} onChange={(e) => set("min_order", Number(e.target.value))} /></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Horario de atención</h2>
        <div className="space-y-1.5"><Label htmlFor="timezone">Zona horaria</Label><Input id="timezone" required value={f.timezone} onChange={(e) => set("timezone", e.target.value)} /></div>
        {DAYS.map(([k, label]) => {
          const d = hours[k] ?? defaultDay;
          const upd = (p: Partial<DayHours>) => { setHoursChanged(true); setHours({ ...hours, [k]: { ...d, ...p } }); };
          return (
            <div key={k} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-medium">{label}</span>
              <Switch checked={d.open} onCheckedChange={(c) => upd({ open: c })} aria-label={`Abierto ${label}`} />
              {d.open ? (<>
                <Input type="time" className="w-28" value={d.from} onChange={(e) => upd({ from: e.target.value })} />
                <span className="text-sm">a</span>
                <Input type="time" className="w-28" value={d.to} onChange={(e) => upd({ to: e.target.value })} />
              </>) : <span className="text-sm text-muted-foreground">Cerrado</span>}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Redes y enlaces</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Instagram", "instagram", "https://instagram.com/tutienda")}
          {field("TikTok", "tiktok", "https://tiktok.com/@tutienda")}
          {field("Facebook", "facebook", "https://facebook.com/tutienda")}
          {field("Sitio web", "website", "https://")}
          {field("Política de devoluciones", "returns_url", "https://")}
        </div>
      </section>

      <Button type="submit" variant="hero" className="w-full" disabled={busy}>{store ? "Guardar cambios" : "Crear tienda"}</Button>
    </form>
  );
}
