import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { Input } from "@/components/ui/input";

const DEFAULT_COUNTRY: CountryCode = "EC";

/** Convierte un número guardado (ej. "0991234567") a formato internacional (+593991234567). */
export function normalizePhone(raw: string, country: CountryCode = DEFAULT_COUNTRY): string {
  const p = parsePhoneNumberFromString(raw, country);
  return p?.isValid() ? p.number : raw;
}

function buildCountryOptions() {
  const names = new Intl.DisplayNames(["es"], { type: "region" });
  return getCountries()
    .map((code) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
    .sort((a, b) => {
      if (a.code === DEFAULT_COUNTRY) return -1;
      if (b.code === DEFAULT_COUNTRY) return 1;
      return a.name.localeCompare(b.name, "es");
    });
}

export function PhoneInput({ value, onChange }: { value: string; onChange: (e164: string) => void }) {
  const options = useMemo(buildCountryOptions, []);
  const [country, setCountry] = useState<CountryCode>(
    () => parsePhoneNumberFromString(value, DEFAULT_COUNTRY)?.country ?? DEFAULT_COUNTRY,
  );
  const [national, setNational] = useState<string>(
    () => parsePhoneNumberFromString(value, DEFAULT_COUNTRY)?.nationalNumber ?? value,
  );

  function update(c: CountryCode, n: string) {
    setCountry(c);
    setNational(n);
    const p = parsePhoneNumberFromString(n, c);
    onChange(p?.isValid() ? p.number : "");
  }

  const parsed = parsePhoneNumberFromString(national, country);
  const hint = parsed?.isValid()
    ? `Los pedidos llegarán a ${parsed.formatInternational()}`
    : national
      ? "Número incompleto o inválido para este país"
      : "";

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          aria-label="País"
          value={country}
          onChange={(e) => update(e.target.value as CountryCode, national)}
          className="h-9 w-44 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name} (+{o.dial})
            </option>
          ))}
        </select>
        <Input
          required
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="99 123 4567"
          value={national}
          onChange={(e) => update(country, e.target.value.replace(/[^\d\s()+-]/g, ""))}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}