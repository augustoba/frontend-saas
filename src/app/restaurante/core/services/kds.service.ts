import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { KdsItem, KdsOrden } from '../models/kds.model';

@Injectable({ providedIn: 'root' })
export class KdsService {
  private readonly http = inject(HttpClient);

  private readonly ordenesSignal = signal<KdsOrden[]>([]);
  readonly ordenes = this.ordenesSignal.asReadonly();

  cargar(): void {
    this.http.get<KdsOrden[]>(apiUrl('/v1/kds/pendientes')).subscribe((data) => this.ordenesSignal.set(data));
  }

  avanzarEstado(itemId: number) {
    return this.http.patch<KdsItem>(apiUrl(`/v1/kds/items/${itemId}/avanzar`), {});
  }
}
