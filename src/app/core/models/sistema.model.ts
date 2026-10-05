/**
 * Sistema que usa una tienda (ver el spec de la reestructuración en el back).
 * Uno solo por tienda: decide qué panel ve el admin y qué sitio público tiene.
 */
export type Sistema = 'ECOMMERCE' | 'POS' | 'RESTAURANTE';

export const SISTEMA_LABELS: Record<Sistema, string> = {
  ECOMMERCE: 'Ecommerce',
  POS: 'Punto de venta',
  RESTAURANTE: 'Restaurante',
};

export const SISTEMAS: Sistema[] = ['ECOMMERCE', 'POS', 'RESTAURANTE'];
