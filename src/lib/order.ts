export type OptionValue = { label: string; price: number };
export type ProductOption = { name: string; values: OptionValue[] };

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

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function itemKey(productId: string, selections: CartItem["selections"]) {
  return productId + "|" + selections.map((s) => `${s.option}=${s.value}`).join(";");
}

export function whatsappDigits(phone: string) {
  let d = phone.replace(/\D/g, "");
  // Ecuador local format 09XXXXXXXX -> 5939XXXXXXXX
  if (d.length === 10 && d.startsWith("0")) d = "593" + d.slice(1);
  return d;
}

export function buildOrderMessage(
  storeName: string,
  items: CartItem[],
  customer: { name: string; address?: string; notes?: string },
) {
  const lines = [`*Nuevo pedido — ${storeName}*`, ""];
  items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.name} x${i.quantity} — ${money(unitPrice(i) * i.quantity)}`);
    i.selections.forEach((s) => lines.push(`   • ${s.option}: ${s.value}`));
  });
  lines.push("", `*Total: ${money(cartTotal(items))}*`, "", `Cliente: ${customer.name}`);
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
