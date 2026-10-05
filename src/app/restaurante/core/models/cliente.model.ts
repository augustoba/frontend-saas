export interface Cliente {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  cuit: string | null;
  instagram: string | null;
  tieneCuentaCorriente: boolean;
  descuentoPorcentaje: number | null;
  activo: boolean;
  saldoCuentaCorriente: number;
}

export interface ClienteKpis {
  total: number;
  conCuentaCorriente: number;
  conDescuento: number;
  activos: number;
}

export type TipoMovimientoCuentaCorriente = 'CARGO' | 'PAGO';

export interface MovimientoCuentaCorriente {
  id: number;
  tipo: TipoMovimientoCuentaCorriente;
  monto: number;
  descripcion: string | null;
  saldoResultante: number;
  fecha: string;
}
