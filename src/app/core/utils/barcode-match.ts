import { Product } from '../models/product.model';

/**
 * Qué escaneó el lector: primero se busca el código entre las variantes (cada
 * talle/medida puede tener el suyo y entonces se sabe exactamente cuál sumar);
 * si no, el código del producto, que sólo alcanza cuando tiene una sola variante.
 * null = no hay una única variante para ese código.
 */
export function varianteEscaneada(products: Product[], code: string): { product: Product; size: string } | null {
  const term = code.trim();
  if (!term) return null;
  for (const p of products) {
    const v = p.sizeStocks.find((s) => s.barcode === term);
    if (v) return { product: p, size: v.size };
  }
  const p = products.find((x) => x.barcode === term);
  return p && p.sizeStocks.length === 1 ? { product: p, size: p.sizeStocks[0].size } : null;
}

/** true si el texto aparece en el nombre, el código del producto o el de alguna variante. */
export function coincideBusqueda(p: Product, termLower: string): boolean {
  return (
    p.name.toLowerCase().includes(termLower) ||
    !!p.barcode?.toLowerCase().includes(termLower) ||
    p.sizeStocks.some((s) => !!s.barcode?.toLowerCase().includes(termLower))
  );
}
