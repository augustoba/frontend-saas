export type ItemPedidoEstado = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
export type PedidoEstado = 'EN_CURSO' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO';

export interface ItemPedido {
  id: number;
  productoNombre: string;
  cantidad: number;
  subtotal: number;
  notas: string | null;
  estado: ItemPedidoEstado;
}

export interface PedidoPublico {
  ordenId: number;
  mesaNombre: string | null;
  estado: PedidoEstado;
  total: number;
  items: ItemPedido[];
}

export interface ProductoAutopedido {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
}

export type SolicitudTipo = 'LLAMAR_MOZO' | 'PEDIR_CUENTA';

export interface SolicitudPendiente {
  id: number;
  ordenId: number;
  mesaNombre: string | null;
  tipo: SolicitudTipo;
  fecha: string;
}
