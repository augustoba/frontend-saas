import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { CapacidadPorSalon, MapaCalor, Reserva, TurnoReserva } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Reserva[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly capacidadSignal = signal<CapacidadPorSalon | null>(null);
  readonly capacidad = this.capacidadSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly mapaCalorSignal = signal<MapaCalor | null>(null);
  readonly mapaCalor = this.mapaCalorSignal.asReadonly();

  private readonly turnosSignal = signal<TurnoReserva[]>([]);
  readonly turnos = this.turnosSignal.asReadonly();

  cargar(fecha: string): void {
    this.loadingSignal.set(true);
    this.http.get<Reserva[]>(apiUrl('/v1/reservas'), { params: { fecha } }).subscribe({
      next: (data) => {
        this.itemsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
    this.http.get<CapacidadPorSalon>(apiUrl('/v1/reservas/capacidad')).subscribe((data) => this.capacidadSignal.set(data));
  }

  crear(request: { salonId: number; nombreCliente: string; telefonoCliente: string | null; fecha: string; hora: string | null; cantidadPersonas: number; notas: string | null }) {
    return this.http.post<Reserva>(apiUrl('/v1/reservas'), request);
  }

  cambiarEstado(id: number, estado: string) {
    return this.http.patch(apiUrl(`/v1/reservas/${id}/estado`), { estado });
  }

  cargarMapaCalor(fecha: string): void {
    this.http.get<MapaCalor>(apiUrl('/v1/reservas/mapa-calor'), { params: { fecha } }).subscribe((data) => this.mapaCalorSignal.set(data));
  }

  cargarTurnos(): void {
    this.http.get<TurnoReserva[]>(apiUrl('/v1/turnos-reserva')).subscribe((data) => this.turnosSignal.set(data));
  }

  crearTurno(request: { nombre: string; horaInicio: string; horaFin: string; capacidadMaxima: number }) {
    return this.http.post<TurnoReserva>(apiUrl('/v1/turnos-reserva'), request);
  }

  actualizarTurno(id: number, request: { nombre: string; horaInicio: string; horaFin: string; capacidadMaxima: number }) {
    return this.http.put<TurnoReserva>(apiUrl(`/v1/turnos-reserva/${id}`), request);
  }

  archivarTurno(id: number) {
    return this.http.delete(apiUrl(`/v1/turnos-reserva/${id}`));
  }
}
