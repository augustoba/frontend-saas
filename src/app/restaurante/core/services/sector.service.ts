import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Sector } from '../models/sector.model';

export interface SectorRequest {
  sucursalId: number;
  nombre: string;
  tipo: Sector['tipo'];
  impresoraIp: string | null;
  kdsActivo: boolean;
}

@Injectable({ providedIn: 'root' })
export class SectorService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Sector[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<Sector[]>(apiUrl('/v1/sectores')).subscribe({
      next: (data) => {
        this.itemsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }

  crear(request: SectorRequest) {
    return this.http.post<Sector>(apiUrl('/v1/sectores'), request);
  }

  archivar(id: number) {
    return this.http.delete(apiUrl(`/v1/sectores/${id}`));
  }
}
