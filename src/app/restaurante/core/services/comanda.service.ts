import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Orden } from '../models/orden.model';

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private readonly http = inject(HttpClient);

  private readonly comandasSignal = signal<Orden[]>([]);
  readonly comandas = this.comandasSignal.asReadonly();

  cargar(): void {
    this.http.get<Orden[]>(apiUrl('/v1/comandas')).subscribe((data) => this.comandasSignal.set(data));
  }

  tomar(ordenId: number) {
    return this.http.patch(apiUrl(`/v1/comandas/${ordenId}/tomar`), {});
  }

  finalizar(ordenId: number) {
    return this.http.patch(apiUrl(`/v1/comandas/${ordenId}/finalizar`), {});
  }

  entregar(ordenId: number) {
    return this.http.patch(apiUrl(`/v1/comandas/${ordenId}/entregar`), {});
  }
}
