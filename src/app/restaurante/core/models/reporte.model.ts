export interface MontoPorDia {
  fecha: string;
  total: number;
}

export interface MontoPorEtiqueta {
  etiqueta: string;
  total: number;
}

export interface ReporteVentas {
  totalVentas: number;
  cantidadOrdenes: number;
  ticketPromedio: number;
  ventasPorDia: MontoPorDia[];
  ventasPorMedioPago: MontoPorEtiqueta[];
}

export interface ReportePropinas {
  totalPropinas: number;
  propinasPorDia: MontoPorDia[];
}

export interface ReportePyL {
  ingresos: number;
  egresos: number;
  resultado: number;
  egresosPorCategoria: MontoPorEtiqueta[];
}

export interface ProductoVendido {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  total: number;
}

export interface ReporteProductos {
  productos: ProductoVendido[];
}
