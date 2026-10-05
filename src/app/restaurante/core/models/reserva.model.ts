export type ReservaEstado = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'NO_SHOW';

export interface Reserva {
  id: number;
  salonId: number;
  salonNombre: string;
  nombreCliente: string;
  telefonoCliente: string | null;
  fecha: string;
  hora: string | null;
  cantidadPersonas: number;
  estado: ReservaEstado;
  notas: string | null;
}

export interface CapacidadSalon {
  salonId: number;
  salonNombre: string;
  capacidadReservable: number;
}

export interface CapacidadPorSalon {
  total: number;
  porSalon: CapacidadSalon[];
}

export interface TurnoReserva {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  capacidadMaxima: number;
  activo: boolean;
}

export interface FilaMapaCalor {
  salonId: number;
  salonNombre: string;
  personasPorHora: Record<number, number>;
}

export interface MapaCalor {
  fecha: string;
  horas: number[];
  filas: FilaMapaCalor[];
}
