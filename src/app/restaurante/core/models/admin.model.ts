export interface MedioPago {
  id: number;
  nombre: string;
  esEfectivo: boolean;
  esCuentaCorriente: boolean;
  requiereReferencia: boolean;
  activo: boolean;
  orden: number;
}

export interface Turno {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface ZonaEnvio {
  id: number;
  nombre: string;
  costo: number;
  activo: boolean;
}

export interface Permiso {
  codigo: string;
  descripcion: string;
  modulo: string;
}

export interface Rol {
  id: number;
  nombre: string;
  esSistema: boolean;
  activo: boolean;
  permisos: string[];
}

export interface Colaborador {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  activo: boolean;
  ultimoAcceso: string | null;
  rolId: number | null;
  rolNombre: string | null;
}

export interface Preferencias {
  preciosConCentavos: boolean;
  sonidosActivos: boolean;
  pasosPorDefecto: boolean;
  agruparPorProducto: boolean;
}

export interface ImportarResultado {
  creados: number;
  actualizados: number;
  errores: string[];
}
