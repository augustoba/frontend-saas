import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { MesaEstado, SalonConMesas } from '../models/mesa.model';

@Injectable({ providedIn: 'root' })
export class MesaService {
  private readonly http = inject(HttpClient);

  private readonly salonesSignal = signal<SalonConMesas[]>([]);
  readonly salones = this.salonesSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<SalonConMesas[]>(apiUrl('/v1/salones')).subscribe({
      next: (data) => {
        this.salonesSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }

  cambiarEstado(mesaId: number, estado: MesaEstado) {
    return this.http.patch(apiUrl(`/v1/mesas/${mesaId}/estado`), { estado });
  }
}
