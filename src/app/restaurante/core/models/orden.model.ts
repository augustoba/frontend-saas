export type OrdenTipo = 'MESA' | 'MOSTRADOR' | 'LLEVAR' | 'DELIVERY';
export type OrdenEstado = 'EN_CURSO' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO';
export type OrdenItemEstado = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
export type EstadoPreparacion = 'SIN_TOMAR' | 'TOMADO' | 'LISTO' | 'ENTREGADO';

export interface OrdenItem {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas: string | null;
  estado: OrdenItemEstado;
  paso: number;
}

export interface Pago {
  id: number;
  medioPagoNombre: string;
  monto: number;
  propina: number;
  fecha: string;
}

export interface Orden {
  id: number;
  tipo: OrdenTipo;
  estado: OrdenEstado;
  mesaId: number | null;
  mesaNombre: string | null;
  comensales: number | null;
  comentario: string | null;
  usuarioNombre: string;
  subtotal: number;
  descuentoMonto: number;
  costoEnvio: number;
  propina: number;
  total: number;
  pagado: number;
  fechaCreacion: string;
  items: OrdenItem[];
  pagos: Pago[];
  tokenSesion: string | null;
  nombreClienteOnline: string | null;
  telefonoClienteOnline: string | null;
  direccionEntrega: string | null;
  pasoActual: number;
  estadoPreparacion: EstadoPreparacion;
  fechaConfirmacion: string | null;
  fechaTomado: string | null;
}

export interface OrdenResumen {
  id: number;
  tipo: OrdenTipo;
  estado: OrdenEstado;
  mesaNombre: string | null;
  total: number;
  fechaCreacion: string;
}
