import { useId } from "react";
import type { OptionType, OptionValue, ProductOption } from "@/lib/order";
import { colorFromName, isHexColor, isSafeSwatchImage } from "@/lib/swatch";

// Si la opción es antigua (sin tipo): "Color" con nombres conocidos se ve como círculos; lo demás como botones.
export function resolveType(o: ProductOption): OptionType {
  if (o.type) return o.type;
  const looksLikeColor = /^(colou?rs?|colores)$/i.test(o.name.trim()) && o.values.every((v) => colorFromName(v.label));
  return looksLikeColor ? "color" : "buttons";
}

function swatchOf(v: OptionValue): { image: string | undefined; color: string | undefined } {
  return {
    image: isSafeSwatchImage(v.image) ? v.image : undefined,
    color: isHexColor(v.color) ? v.color : colorFromName(v.label),
  };
}

export function OptionPicker({
  option,
  value,
  onChange,
  fmt,
}: {
  option: ProductOption;
  value: number;
  onChange: (index: number) => void;
  fmt: (n: number) => string;
}) {
  const id = useId();
  const type = resolveType(option);
  const current = option.values[value];
  const extra = (v: OptionValue) => (Number(v.price) ? ` (+${fmt(Number(v.price))})` : "");

  const chip = (v: OptionValue, i: number) => {
    const active = value === i;
    return (
      <button
        key={`${v.label}-${i}`}
        type="button"
        aria-pressed={active}
        onClick={() => onChange(i)}
        className={`min-h-10 min-w-11 rounded-md border px-3 text-sm font-medium ${active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground"}`}
      >
        {v.label}
      </button>
    );
  };

  if (type === "list") {
    return (
      <div>
        <label htmlFor={id} className="mb-2 block text-sm">
          {option.name}
        </label>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          {option.values.map((v, i) => (
            <option key={`${v.label}-${i}`} value={i}>
              {v.label}
              {extra(v)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm">
        {option.name} <span className="font-semibold">{current?.label}</span>
        {current && Number(current.price) ? <span className="text-muted-foreground"> (+{fmt(Number(current.price))})</span> : null}
      </p>

      {type === "radio" && (
        <div role="radiogroup" aria-label={option.name} className="space-y-2">
          {option.values.map((v, i) => {
            const active = value === i;
            return (
              <label
                key={`${v.label}-${i}`}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${active ? "border-primary bg-accent" : "border-border bg-card"}`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name={`${id}-opt`} checked={active} onChange={() => onChange(i)} className="h-4 w-4 accent-primary" />
                  {v.label}
                </span>
                {Number(v.price) ? <span className="text-muted-foreground">+{fmt(Number(v.price))}</span> : null}
              </label>
            );
          })}
        </div>
      )}

      {type === "color" && (
        <div role="radiogroup" aria-label={option.name} className="flex flex-wrap gap-2">
          {option.values.map((v, i) => {
            const { image, color } = swatchOf(v);
            if (!image && !color) return chip(v, i);
            const active = value === i;
            return (
              <button
                key={`${v.label}-${i}`}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={v.label}
                title={v.label}
                onClick={() => onChange(i)}
                className={`h-10 w-10 shrink-0 rounded-full border-2 p-0.5 ${active ? "border-foreground" : "border-border"}`}
              >
                {image ? (
                  <img src={image} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="block h-full w-full rounded-full border border-black/10" style={{ backgroundColor: color }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {type === "buttons" && <div className="flex flex-wrap gap-2">{option.values.map((v, i) => chip(v, i))}</div>}
    </div>
  );
}