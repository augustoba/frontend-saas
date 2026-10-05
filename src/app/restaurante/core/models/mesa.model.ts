export type MesaForma = 'CUADRADA' | 'CIRCULAR' | 'RECTANGULAR';
export type MesaEstado = 'LIBRE' | 'OCUPADA' | 'ESPERANDO_PAGO';

export interface Mesa {
  id: number;
  salonId: number;
  nombre: string;
  forma: MesaForma;
  posX: number;
  posY: number;
  ancho: number;
  alto: number;
  rotacion: number;
  estado: MesaEstado;
  capacidad: number;
}

export interface Salon {
  id: number;
  nombre: string;
  orden: number;
}

export interface SalonConMesas {
  salon: Salon;
  mesas: Mesa[];
}
