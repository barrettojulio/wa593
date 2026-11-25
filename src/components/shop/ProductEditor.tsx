import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/images";
import type { ProductOption } from "@/lib/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ProductRow = {
  id?: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  options: ProductOption[];
  active: boolean;
  category_id: string | null;
};

export const emptyProduct: ProductRow = { name: "", description: "", price: 0, images: [], options: [], active: true, category_id: null };

export function ProductEditor({
  open,
  onOpenChange,
  initial,
  storeId,
  userId,
  urls,
  categories = [],
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ProductRow;
  storeId: string;
  userId: string;
  urls: Record<string, string>;
  categories?: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [p, setP] = useState<ProductRow>(initial);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const setOpt = (i: number, o: ProductOption) => setP({ ...p, options: p.options.map((x, j) => (j === i ? o : x)) });

  async function addImages(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const added: string[] = [];
      const pv: Record<string, string> = {};
      for (const f of Array.from(files)) {
        const path = await uploadImage(userId, f);
        added.push(path);
        pv[path] = URL.createObjectURL(f);
      }
      setPreview({ ...preview, ...pv });
      setP((cur) => ({ ...cur, images: [...cur.images, ...added] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir");
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<void> {
    if (!p.name.trim()) return void toast.error("Ponle un nombre al producto");
    setBusy(true);
    const options = p.options
      .map((o) => ({ name: o.name.trim(), values: o.values.filter((v) => v.label.trim()) }))
      .filter((o) => o.name && o.values.length);
    const row = { name: p.name.trim(), description: p.description, price: Number(p.price) || 0, images: p.images, options, active: p.active, category_id: p.category_id, store_id: storeId };
    const { error } = p.id
      ? await supabase.from("products").update(row).eq("id", p.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Producto guardado");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{p.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2">
              {p.images.map((path) => (
                <div key={path} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <img src={preview[path] ?? urls[path]} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Quitar foto" className="absolute right-1 top-1 rounded-full bg-background p-0.5" onClick={() => setP({ ...p, images: p.images.filter((x) => x !== path) })}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary">
                <Plus />
                <input type="file" accept="image/*" multiple hidden onChange={(e) => addImages(e.target.files)} />
              </label>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Precio base ($)</Label>
              <Input type="number" min={0} step="0.01" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Categoría</Label>
            <select id="cat" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={p.category_id ?? ""} onChange={(e) => setP({ ...p, category_id: e.target.value || null })}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Opciones (talla, color, tamaño…)</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setP({ ...p, options: [...p.options, { name: "", values: [{ label: "", price: 0 }] }] })}>
                <Plus className="h-4 w-4" /> Opción
              </Button>
            </div>
            {p.options.map((o, i) => (
              <div key={i} className="space-y-2 rounded-xl border bg-muted/50 p-3">
                <div className="flex gap-2">
                  <Input placeholder="Ej: Talla" value={o.name} onChange={(e) => setOpt(i, { ...o, name: e.target.value })} />
                  <Button type="button" size="icon" variant="ghost" aria-label="Quitar opción" onClick={() => setP({ ...p, options: p.options.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {o.values.map((v, k) => (
                  <div key={k} className="flex gap-2 pl-3">
                    <Input placeholder="Ej: M" value={v.label} onChange={(e) => setOpt(i, { ...o, values: o.values.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} />
                    <Input className="w-28" type="number" step="0.01" placeholder="+$" value={v.price} onChange={(e) => setOpt(i, { ...o, values: o.values.map((x, j) => (j === k ? { ...x, price: Number(e.target.value) } : x)) })} />
                    <Button type="button" size="icon" variant="ghost" aria-label="Quitar valor" onClick={() => setOpt(i, { ...o, values: o.values.filter((_, j) => j !== k) })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="link" onClick={() => setOpt(i, { ...o, values: [...o.values, { label: "", price: 0 }] })}>
                  + Agregar valor
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">El monto "+$" se suma al precio base cuando el cliente elige ese valor.</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={p.active} onCheckedChange={(c) => setP({ ...p, active: c })} id="act" />
            <Label htmlFor="act">Visible en la tienda</Label>
          </div>
          <Button variant="hero" className="w-full" disabled={busy} onClick={save}>
            Guardar producto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
