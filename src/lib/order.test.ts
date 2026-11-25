import { describe, it, expect } from "vitest";
import { buildOrderMessage, cartTotal, whatsappDigits, type CartItem } from "./order";

const item: CartItem = {
  key: "a",
  productId: "p1",
  name: "Camiseta",
  basePrice: 10,
  selections: [
    { option: "Talla", value: "XL", price: 2 },
    { option: "Color", value: "Negro", price: 0 },
  ],
  quantity: 2,
};

describe("pedido", () => {
  it("suma el precio de las opciones por cantidad", () => {
    expect(cartTotal([item])).toBe(24);
  });
  it("el mensaje incluye opciones y total", () => {
    const m = buildOrderMessage("Tienda", [item], { name: "Ana" });
    expect(m).toContain("Talla: XL");
    expect(m).toContain("Total: $24.00");
  });
  it("convierte número local de Ecuador a formato internacional", () => {
    expect(whatsappDigits("099 123 4567")).toBe("593991234567");
  });
    it("acepta un número de Ecuador sin el 0 inicial", () => {
    expect(whatsappDigits("991234567")).toBe("593991234567");
  });
  it("deja intacto un número ya internacional", () => {
    expect(whatsappDigits("+593 99 123 4567")).toBe("593991234567");
  });
});
