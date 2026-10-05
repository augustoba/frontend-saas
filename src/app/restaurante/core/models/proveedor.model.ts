export interface Proveedor {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  cuit: string | null;
  direccion: string | null;
  saldo: number;
  activo: boolean;
}
