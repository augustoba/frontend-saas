export type OrdenItemEstado = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
export type OrdenTipo = 'MESA' | 'MOSTRADOR' | 'LLEVAR' | 'DELIVERY';

export interface KdsItem {
  itemId: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  notas: string | null;
  estado: OrdenItemEstado;
}

export interface KdsOrden {
  ordenId: number;
  tipo: OrdenTipo;
  mesaNombre: string | null;
  fechaCreacion: string;
  items: KdsItem[];
}
