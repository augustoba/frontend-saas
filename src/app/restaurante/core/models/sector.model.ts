export type SectorTipo = 'IMPRESORA' | 'KDS' | 'NINGUNA' | 'AMBOS';

export interface Sector {
  id: number;
  sucursalId: number;
  nombre: string;
  tipo: SectorTipo;
  impresoraIp: string | null;
  kdsActivo: boolean;
  activo: boolean;
}
