export type ArqueoEstado = 'ABIERTO' | 'CERRADO';
export type MovimientoTipo = 'INGRESO' | 'EGRESO' | 'RETIRO' | 'AJUSTE' | 'VENTA' | 'PAGO_GASTO';

export interface Caja {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Arqueo {
  id: number;
  cajaNombre: string;
  usuarioAperturaNombre: string;
  fechaApertura: string;
  fechaCierre: string | null;
  montoApertura: number;
  montoCierreDeclarado: number | null;
  montoCierreSistema: number | null;
  diferencia: number | null;
  estado: ArqueoEstado;
  totalVentas: number;
  efectivoEnCaja: number;
}

export interface MovimientoCaja {
  id: number;
  tipo: MovimientoTipo;
  monto: number;
  descripcion: string | null;
  fecha: string;
}
