// Colores y miniaturas para las opciones de producto (estilo "color o textura").

// Nombres de color comunes en español, para opciones antiguas que no tienen color guardado.
const NAME_COLORS: Record<string, string> = {
  negro: "#111111", blanco: "#ffffff", gris: "#9ca3af", rojo: "#dc2626", azul: "#2563eb",
  "azul marino": "#1e3a8a", verde: "#16a34a", amarillo: "#facc15", naranja: "#f97316",
  rosado: "#f472b6", rosa: "#f472b6", morado: "#7c3aed", lila: "#c4b5fd", café: "#7c4a2d",
  cafe: "#7c4a2d", beige: "#d6c3a1", celeste: "#38bdf8", turquesa: "#14b8a6", vino: "#7f1d1d",
  dorado: "#d4af37", plateado: "#c0c0c0",
};

export function colorFromName(label: string): string | undefined {
  return NAME_COLORS[label.trim().toLowerCase()];
}

export function isHexColor(v: string | undefined): v is string {
  return !!v && /^#[0-9a-f]{6}$/i.test(v);
}

// Las miniaturas se guardan dentro de la opción (data URL). Solo se muestran si son imágenes pequeñas y válidas.
export function isSafeSwatchImage(v: string | undefined): v is string {
  return !!v && v.length < 30000 && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(v);
}

// Recorta la imagen al centro y la reduce a un cuadrito (48 px) para que pese solo unos KB.
export async function fileToSwatch(file: File, size = 48): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen");
  const side = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  bmp.close();
  return canvas.toDataURL("image/webp", 0.8);
}