export type ProductoTipo = 'INGREDIENTE' | 'VENDIBLE' | 'COMBO' | 'SERVICIO';

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  tipo: ProductoTipo;
  costo: number | null;
  precio: number | null;
  unidad: string | null;
  disponible: boolean;
  disponibleOnline: boolean;
  activo: boolean;
  controlaStock: boolean;
  stockActual: number | null;
  grupoModificadorIds: number[];
}

export interface ProductoRequest {
  categoriaId: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  tipo?: ProductoTipo;
  costo: number | null;
  precio: number | null;
  unidad: string | null;
  controlaStock: boolean;
  disponibleOnline: boolean;
}

export interface Modificador {
  id: number;
  nombre: string;
  precioAdicional: number;
  activo: boolean;
}

export interface GrupoModificador {
  id: number;
  nombre: string;
  obligatorio: boolean;
  multiple: boolean;
  min: number | null;
  max: number | null;
  activo: boolean;
  modificadores: Modificador[];
}

export interface ListaPrecio {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface ListaPrecioItem {
  id: number;
  productoId: number;
  productoNombre: string;
  precioBase: number | null;
  precio: number;
}

export type TipoMovimientoStock = 'INGRESO' | 'EGRESO' | 'AJUSTE';

export interface MovimientoStock {
  id: number;
  productoId: number;
  productoNombre: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stockResultante: number;
  motivo: string | null;
  fecha: string;
}

export interface InventarioItem {
  productoId: number;
  productoNombre: string;
  categoriaNombre: string;
  stockActual: number | null;
}
