import { Injectable, inject, signal } from '@angular/core';
import { shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Orden, OrdenResumen } from '../models/orden.model';

const CAJA_ACTIVA_KEY = 'restaurante_caja_activa_id';

function cajaActivaGuardada(): number | null {
  try {
    const raw = localStorage.getItem(CAJA_ACTIVA_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

// Cada "const obs" se suscribe acá Y en la pantalla que lo llama: sin shareReplay
// salían dos requests (dos órdenes, dos pagos). Un solo request para todos.
@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly http = inject(HttpClient);

  private readonly ordenActualSignal = signal<Orden | null>(null);
  readonly ordenActual = this.ordenActualSignal.asReadonly();

  private readonly cajaActivaIdSignal = signal<number | null>(cajaActivaGuardada());
  readonly cajaActivaId = this.cajaActivaIdSignal.asReadonly();

  elegirCajaActiva(arqueoId: number | null): void {
    this.cajaActivaIdSignal.set(arqueoId);
    try {
      if (arqueoId != null) localStorage.setItem(CAJA_ACTIVA_KEY, String(arqueoId));
      else localStorage.removeItem(CAJA_ACTIVA_KEY);
    } catch {
      // localStorage no disponible — la selección sólo dura la sesión actual.
    }
  }

  abrirMesa(mesaId: number, comensales: number) {
    const obs = this.http.post<Orden>(apiUrl('/v1/ordenes/mesa'), { mesaId, comensales, arqueoId: this.cajaActivaId() }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  abrirMostrador(clienteId: number | null = null) {
    const obs = this.http.post<Orden>(apiUrl('/v1/ordenes/mostrador'), { clienteId, arqueoId: this.cajaActivaId() }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  listarMostradorAbiertas() {
    return this.http.get<OrdenResumen[]>(apiUrl('/v1/ordenes/mostrador'));
  }

  cargarPorMesa(mesaId: number) {
    const obs = this.http.get<Orden>(apiUrl(`/v1/ordenes/mesa/${mesaId}`)).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  cargar(ordenId: number) {
    const obs = this.http.get<Orden>(apiUrl(`/v1/ordenes/${ordenId}`)).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  limpiar(): void {
    this.ordenActualSignal.set(null);
  }

  agregarItem(ordenId: number, productoId: number, cantidad: number, notas: string | null) {
    const obs = this.http.post<Orden>(apiUrl(`/v1/ordenes/${ordenId}/items`), { productoId, cantidad, notas }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  editarItem(ordenId: number, itemId: number, cantidad: number, notas: string | null) {
    const obs = this.http.put<Orden>(apiUrl(`/v1/ordenes/${ordenId}/items/${itemId}`), { cantidad, notas }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  quitarItem(ordenId: number, itemId: number) {
    const obs = this.http.delete<Orden>(apiUrl(`/v1/ordenes/${ordenId}/items/${itemId}`)).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  confirmar(ordenId: number) {
    const obs = this.http.post<Orden>(apiUrl(`/v1/ordenes/${ordenId}/confirmar`), {}).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  siguientePaso(ordenId: number) {
    const obs = this.http.post<Orden>(apiUrl(`/v1/ordenes/${ordenId}/siguiente-paso`), {}).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  pagar(ordenId: number, medioPagoId: number, monto: number, propina: number) {
    const obs = this.http.post<Orden>(apiUrl(`/v1/ordenes/${ordenId}/pagos`), { medioPagoId, monto, propina }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }

  cancelar(ordenId: number) {
    return this.http.post<Orden>(apiUrl(`/v1/ordenes/${ordenId}/cancelar`), {});
  }

  aplicarDescuento(ordenId: number, monto: number) {
    const obs = this.http.put<Orden>(apiUrl(`/v1/ordenes/${ordenId}/descuento`), { monto }).pipe(shareReplay(1));
    obs.subscribe((o) => this.ordenActualSignal.set(o));
    return obs;
  }
}
