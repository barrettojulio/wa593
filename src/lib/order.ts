// Cómo se muestra una opción al cliente: botones, lista desplegable, bolitas de selección, o color/imagen.
export type OptionType = "buttons" | "list" | "radio" | "color";
export type OptionValue = { label: string; price: number; color?: string; image?: string };
export type ProductOption = { name: string; type?: OptionType; values: OptionValue[] };

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  basePrice: number;
  selections: { option: string; value: string; price: number }[];
  quantity: number;
};

export function unitPrice(item: Pick<CartItem, "basePrice" | "selections">) {
  return item.basePrice + item.selections.reduce((s, x) => s + x.price, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
}

export function money(n: number, symbol = "$") {
  const s = symbol.trim() || "$";
  // Símbolos largos como "S/" o "COP" llevan un espacio: "S/ 12.00"
  return `${s}${s.length > 1 ? " " : ""}${n.toFixed(2)}`;
}

export function itemKey(productId: string, selections: CartItem["selections"]) {
  return productId + "|" + selections.map((s) => `${s.option}=${s.value}`).join(";");
}

export function whatsappDigits(phone: string) {
  let d = phone.replace(/\D/g, "");
  // Ecuador local: 09XXXXXXXX o 9XXXXXXXX (sin el 0) -> 5939XXXXXXXX
  if (d.length === 10 && d.startsWith("0")) d = "593" + d.slice(1);
  else if (d.length === 9 && d.startsWith("9")) d = "593" + d;
  return d;
}

export function buildOrderMessage(
  storeName: string,
  items: CartItem[],
  customer: { name: string; address?: string; notes?: string },
  symbol = "$",
) {
  const lines = [`*Nuevo pedido — ${storeName}*`, ""];
  items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.name} x${i.quantity} — ${money(unitPrice(i) * i.quantity, symbol)}`);
    i.selections.forEach((s) => lines.push(`   • ${s.option}: ${s.value}`));
  });
  lines.push("", `*Total: ${money(cartTotal(items), symbol)}*`, "", `Cliente: ${customer.name}`);
  if (customer.address) lines.push(`Dirección: ${customer.address}`);
  if (customer.notes) lines.push(`Notas: ${customer.notes}`);
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${whatsappDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}