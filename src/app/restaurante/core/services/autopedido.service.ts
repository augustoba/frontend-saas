import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { PedidoPublico, ProductoAutopedido, SolicitudPendiente } from '../models/autopedido.model';

@Injectable({ providedIn: 'root' })
export class AutopedidoService {
  private readonly http = inject(HttpClient);

  private readonly pedidoSignal = signal<PedidoPublico | null>(null);
  readonly pedido = this.pedidoSignal.asReadonly();
  private readonly catalogoSignal = signal<ProductoAutopedido[]>([]);
  readonly catalogo = this.catalogoSignal.asReadonly();
  private readonly noDisponibleSignal = signal(false);
  readonly noDisponible = this.noDisponibleSignal.asReadonly();

  private readonly solicitudesSignal = signal<SolicitudPendiente[]>([]);
  readonly solicitudes = this.solicitudesSignal.asReadonly();

  cargar(token: string): void {
    this.http.get<PedidoPublico>(apiUrl(`/v1/pedido/${token}`)).subscribe({
      next: (data) => this.pedidoSignal.set(data),
      error: () => this.noDisponibleSignal.set(true),
    });
    this.http.get<ProductoAutopedido[]>(apiUrl(`/v1/pedido/${token}/productos`)).subscribe((data) => this.catalogoSignal.set(data));
  }

  agregarItem(token: string, productoId: number, cantidad: number, notas: string | null) {
    return this.http.post<PedidoPublico>(apiUrl(`/v1/pedido/${token}/items`), { productoId, cantidad, notas });
  }

  llamarMozo(token: string) {
    return this.http.post(apiUrl(`/v1/pedido/${token}/llamar-mozo`), {});
  }

  pedirCuenta(token: string) {
    return this.http.post(apiUrl(`/v1/pedido/${token}/pedir-cuenta`), {});
  }

  // --- Staff ---
  cargarSolicitudesPendientes(): void {
    this.http.get<SolicitudPendiente[]>(apiUrl('/v1/solicitudes-mesa/pendientes')).subscribe((data) => this.solicitudesSignal.set(data));
  }

  atenderSolicitud(id: number) {
    return this.http.patch(apiUrl(`/v1/solicitudes-mesa/${id}/atender`), {});
  }
}
