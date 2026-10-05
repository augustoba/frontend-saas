import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Orden, OrdenTipo } from '../models/orden.model';

export interface ItemCarrito {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class PedidoOnlineService {
  private readonly http = inject(HttpClient);

  private readonly pendientesSignal = signal<Orden[]>([]);
  readonly pendientes = this.pendientesSignal.asReadonly();

  crear(request: {
    nombreCliente: string;
    telefonoCliente: string;
    direccionEntrega: string | null;
    tipo: OrdenTipo;
    metodoPago: string | null;
    zonaEnvioId: number | null;
    items: { productoId: number; cantidad: number; notas: string | null }[];
  }) {
    return this.http.post<Orden>(apiUrl('/v1/pedidos-online'), request);
  }

  cargarPendientes(): void {
    this.http.get<Orden[]>(apiUrl('/v1/pedidos-online/pendientes')).subscribe((data) => this.pendientesSignal.set(data));
  }

  aceptar(ordenId: number) {
    return this.http.post(apiUrl(`/v1/ordenes/${ordenId}/confirmar`), {});
  }

  rechazar(ordenId: number) {
    return this.http.post(apiUrl(`/v1/ordenes/${ordenId}/cancelar`), {});
  }
}
