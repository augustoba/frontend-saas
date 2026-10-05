import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Arqueo, Caja, MovimientoCaja } from '../models/caja.model';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);

  private readonly cajasSignal = signal<Caja[]>([]);
  readonly cajas = this.cajasSignal.asReadonly();
  private readonly abiertosSignal = signal<Arqueo[]>([]);
  readonly arqueosAbiertos = this.abiertosSignal.asReadonly();
  private readonly historialSignal = signal<Arqueo[]>([]);
  readonly historial = this.historialSignal.asReadonly();
  private readonly movimientosSignal = signal<MovimientoCaja[]>([]);
  readonly movimientos = this.movimientosSignal.asReadonly();

  cargarCajas(): void {
    this.http.get<Caja[]>(apiUrl('/v1/cajas')).subscribe((data) => this.cajasSignal.set(data));
  }

  crearCaja(nombre: string) {
    return this.http.post<Caja>(apiUrl('/v1/cajas'), { nombre, activa: true });
  }

  cargarArqueos(): void {
    this.http.get<Arqueo[]>(apiUrl('/v1/arqueos/abiertos')).subscribe((data) => this.abiertosSignal.set(data));
    this.http.get<Arqueo[]>(apiUrl('/v1/arqueos')).subscribe((data) => this.historialSignal.set(data));
  }

  abrirArqueo(cajaId: number, montoApertura: number) {
    return this.http.post(apiUrl('/v1/arqueos'), { cajaId, montoApertura });
  }

  cargarMovimientos(): void {
    this.http.get<MovimientoCaja[]>(apiUrl('/v1/movimientos-caja')).subscribe((data) => this.movimientosSignal.set(data));
  }

  crearMovimiento(request: { arqueoId: number; tipo: string; monto: number; descripcion: string | null }) {
    return this.http.post<MovimientoCaja>(apiUrl('/v1/movimientos-caja'), request);
  }
}
