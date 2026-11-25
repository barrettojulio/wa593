import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const categoriesQueryKey = (storeId: string) => ["categories", storeId];

export function useCategories(storeId: string) {
  return useQuery({
    queryKey: categoriesQueryKey(storeId),
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("store_id", storeId).order("position").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function CategoriesManager({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const q = useCategories(storeId);
  const [name, setName] = useState("");
  const list = q.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: categoriesQueryKey(storeId) });

  async function add(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ store_id: storeId, name: name.trim(), position: list.length });
    if (error) return void toast.error(error.message);
    setName(""); refresh();
  }
  async function rename(id: string, n: string) {
    if (!n.trim()) return;
    const { error } = await supabase.from("categories").update({ name: n.trim() }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }
  async function move(i: number, dir: -1 | 1) {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("categories").update({ position: i + dir }).eq("id", a.id),
      supabase.from("categories").update({ position: i }).eq("id", b.id),
    ]);
    refresh();
  }
  async function remove(id: string): Promise<void> {
    if (!confirm("¿Eliminar esta categoría? Sus productos quedarán sin categoría.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    refresh(); qc.invalidateQueries({ queryKey: ["my-products"] });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-3xl border-2 border-brand-ink bg-card p-7 shadow-pop">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder="Ej: Camisetas" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="hero"><Plus className="h-4 w-4" /> Agregar</Button>
      </form>
      {list.length === 0 && !q.isLoading && <p className="text-sm text-muted-foreground">Aún no tienes categorías.</p>}
      <ul className="space-y-2">
        {list.map((c, i) => (
          <li key={c.id} className="flex items-center gap-1">
            <Input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && rename(c.id, e.target.value)} />
            <Button size="icon" variant="ghost" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Bajar" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Eliminar categoría" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
