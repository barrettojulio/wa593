import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProductOption } from "@/lib/order";
import { OptionPicker, resolveType } from "./OptionPicker";

const fmt = (n: number) => `$${n.toFixed(2)}`;

describe("OptionPicker", () => {
  it("lista desplegable: elige un valor y muestra el precio extra", () => {
    const onChange = vi.fn();
    const option: ProductOption = { name: "Tamaño", type: "list", values: [{ label: "Chico", price: 0 }, { label: "Grande", price: 3 }] };
    render(<OptionPicker option={option} value={0} onChange={onChange} fmt={fmt} />);
    const select = screen.getByLabelText("Tamaño") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.options[1]?.text).toContain("+$3.00");
    fireEvent.change(select, { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("bolitas de selección: un radio por valor", () => {
    const onChange = vi.fn();
    const option: ProductOption = { name: "Material", type: "radio", values: [{ label: "Algodón", price: 0 }, { label: "Lino", price: 2 }] };
    render(<OptionPicker option={option} value={0} onChange={onChange} fmt={fmt} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(2);
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("color o imagen: usa el color guardado, la miniatura y rechaza imágenes no seguras", () => {
    const onChange = vi.fn();
    const tiny = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4";
    const option: ProductOption = {
      name: "Acabado",
      type: "color",
      values: [
        { label: "Rojo vino", price: 0, color: "#7f1d1d" },
        { label: "Madera", price: 0, image: tiny },
        { label: "Raro", price: 0, image: "javascript:alert(1)" },
      ],
    };
    const { container } = render(<OptionPicker option={option} value={0} onChange={onChange} fmt={fmt} />);
    expect(screen.getByLabelText("Rojo vino")).toBeTruthy();
    expect(container.querySelectorAll("img").length).toBe(1);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(tiny);
    // "Raro" no tiene color ni imagen válida: se muestra como botón de texto
    expect(screen.getByText("Raro")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Madera"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("opciones antiguas: 'Color' con nombres conocidos son círculos; 'Talla' son botones", () => {
    const color: ProductOption = { name: "Color", values: [{ label: "Negro", price: 0 }, { label: "Azul", price: 0 }] };
    const talla: ProductOption = { name: "Talla", values: [{ label: "S", price: 0 }, { label: "M", price: 0 }] };
    expect(resolveType(color)).toBe("color");
    expect(resolveType(talla)).toBe("buttons");
    const { container } = render(<OptionPicker option={talla} value={1} onChange={() => {}} fmt={fmt} />);
    const m = screen.getByText("M", { selector: "button" });
    expect(m.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll("button").length).toBe(2);
  });
});