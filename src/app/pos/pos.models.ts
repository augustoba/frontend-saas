/** Tipos de la API del punto de venta (`/api/pos/**`, ver backend `com.saasweb.pos`). */

export interface Categoria {
  id: string;
  nombre: string;
  posicion: number;
}

export interface Articulo {
  id: string;
  nombre: string;
  codigoBarras: string | null;
  precio: number;
  costo: number | null;
  iva: number | null;
  stock: number;
  umbralStock: number | null;
  stockBajo: boolean;
  categoriaId: string | null;
  archivado: boolean;
  creadoEn: string;
}

export interface ArticuloInput {
  nombre: string;
  codigoBarras: string | null;
  precio: number;
  costo: number | null;
  iva: number | null;
  stockInicial?: number | null;
  umbralStock: number | null;
  categoriaId: string | null;
}

export type MotivoStock = 'VENTA' | 'ANULACION' | 'INGRESO' | 'AJUSTE';

export const MOTIVO_STOCK_LABELS: Record<MotivoStock, string> = {
  VENTA: 'Venta',
  ANULACION: 'Anulación',
  INGRESO: 'Ingreso de mercadería',
  AJUSTE: 'Ajuste por conteo',
};

export interface MovimientoStock {
  id: string;
  articuloId: string;
  articuloNombre: string;
  cantidad: number;
  stockResultante: number;
  motivo: MotivoStock;
  referenciaId: string | null;
  nota: string | null;
  costoUnitario: number | null;
  autorNombre: string | null;
  fecha: string;
}

export type MedioPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'QR';

export const MEDIOS_PAGO: MedioPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR'];

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta (posnet)',
  TRANSFERENCIA: 'Transferencia',
  QR: 'QR',
};

export interface ItemVenta {
  articuloId: string | null;
  cantidad: number;
  nombre?: string;
  precio?: number;
}

export interface VentaInput {
  items: ItemVenta[];
  medioPago: MedioPago;
  montoEntregado: number | null;
  referencia: string | null;
  cuitComprador: string | null;
}

export interface Factura {
  tipo: string | null;
  cae: string | null;
  caeVencimiento: string | null;
  numero: number | null;
  puntoVenta: number | null;
  qrUrl: string | null;
  error: string | null;
}

export interface LineaVenta {
  articuloId: string | null;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  iva: number | null;
  subtotal: number;
}

export interface Venta {
  id: string;
  codigo: string;
  numero: number;
  cajaId: string;
  fecha: string;
  cajeroNombre: string | null;
  total: number;
  medioPago: MedioPago;
  montoEntregado: number | null;
  vuelto: number | null;
  referencia: string | null;
  cuitComprador: string | null;
  estado: 'COMPLETADA' | 'ANULADA';
  anuladaEn: string | null;
  anuladaPorNombre: string | null;
  motivoAnulacion: string | null;
  factura: Factura | null;
  lineas: LineaVenta[];
}

export interface Caja {
  id: string;
  numero: number;
  estado: 'ABIERTA' | 'CERRADA';
  abiertaEn: string;
  abiertaPorNombre: string | null;
  montoInicial: number;
  cerradaEn: string | null;
  cerradaPorNombre: string | null;
  efectivoEsperado: number | null;
  efectivoContado: number | null;
  diferencia: number | null;
  notaCierre: string | null;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  motivo: string;
  gastoId: string | null;
  autorNombre: string | null;
  fecha: string;
}

export interface ResumenCaja {
  caja: Caja;
  cantidadVentas: number;
  ventasAnuladas: number;
  totalVendido: number;
  porMedioPago: Record<MedioPago, number>;
  ingresos: number;
  egresos: number;
  efectivoEsperado: number;
  movimientos: MovimientoCaja[];
}

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string | null;
  nota: string | null;
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string | null;
  monto: number;
  proveedorId: string | null;
  pagadoDeCaja: boolean;
  autorNombre: string | null;
}

export interface GastoInput {
  fecha: string | null;
  concepto: string;
  categoria: string | null;
  monto: number;
  proveedorId: string | null;
  pagadoDeCaja: boolean;
}

export interface Reporte {
  desde: string;
  hasta: string;
  cantidadVentas: number;
  totalVendido: number;
  costoMercaderia: number;
  vendidoSinCosto: number;
  gananciaBruta: number;
  gastos: number;
  resultado: number;
  porMedioPago: Record<MedioPago, number>;
  gastosPorCategoria: Record<string, number>;
  masVendidos: { articuloId: string | null; nombre: string; unidades: number; total: number }[];
}

/** "Factura C 0003-00000007" o null si la venta no quedó facturada. */
export function etiquetaFactura(f: Factura | null): string | null {
  if (!f?.cae || f.numero == null || f.puntoVenta == null) return null;
  const tipo = (f.tipo ?? '').replace('FACTURA_', 'Factura ').replace('NC_', 'Nota de crédito ');
  return `${tipo} ${String(f.puntoVenta).padStart(4, '0')}-${String(f.numero).padStart(8, '0')}`;
}
