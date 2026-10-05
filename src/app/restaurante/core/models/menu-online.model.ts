export type FormaLogo = 'CIRCULAR' | 'CUADRADA';
export type MenuLayout = 'LISTA' | 'CARTA' | 'GALERIA';
export type Tipografia = 'MODERNA' | 'CLASICA' | 'RELAJADA' | 'AUDAZ';

export interface RedSocial {
  plataforma: string;
  url: string;
  nombreMostrar: string | null;
}

export interface MenuOnlineConfig {
  slug: string;
  logoUrl: string | null;
  formaLogo: FormaLogo;
  layout: MenuLayout;
  columnasMax: number;
  tipografia: Tipografia;
  encabezadoTexto: string | null;
  mostrarDescripciones: boolean;
  mostrarDireccion: boolean;
  redesSociales: RedSocial[];
}

export interface ProductoPublico {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  likes: number;
}

export interface ComentarioProducto {
  id: number;
  nombreCliente: string;
  texto: string;
  fecha: string;
}

export interface ProductoDetallePublico {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  likes: number;
  comentarios: ComentarioProducto[];
}

export interface AnaliticaProducto {
  productoId: number;
  productoNombre: string;
  vistas: number;
  likes: number;
  comentarios: number;
}

export interface ComentarioAdmin {
  id: number;
  productoId: number;
  productoNombre: string;
  nombreCliente: string;
  texto: string;
  fecha: string;
}

export interface CategoriaPublica {
  id: number;
  nombre: string;
  productos: ProductoPublico[];
}

export interface ZonaEnvioPublica {
  id: number;
  nombre: string;
  costo: number;
}

export interface CartaPublica {
  nombreRestaurante: string;
  direccion: string | null;
  telefono: string | null;
  logoUrl: string | null;
  formaLogo: FormaLogo;
  layout: MenuLayout;
  columnasMax: number;
  encabezadoTexto: string | null;
  mostrarDescripciones: boolean;
  mostrarDireccion: boolean;
  redesSociales: RedSocial[];
  categorias: CategoriaPublica[];
  zonasEnvio: ZonaEnvioPublica[];
}
