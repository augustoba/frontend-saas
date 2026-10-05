export type GastoEstado = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';

export interface ClasificacionGasto {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CategoriaGasto {
  id: number;
  clasificacionId: number;
  clasificacionNombre: string;
  nombre: string;
  activo: boolean;
}

export interface Gasto {
  id: number;
  proveedorNombre: string | null;
  categoriaNombre: string;
  fecha: string;
  fechaVencimiento: string | null;
  monto: number;
  descripcion: string | null;
  estado: GastoEstado;
}

export interface GastoKpis {
  aVencer: number;
  vencidos: number;
  totalAPagar: number;
  totalPagado: number;
}
