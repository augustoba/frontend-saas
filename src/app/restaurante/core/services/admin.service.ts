import { Injectable, inject, signal } from '@angular/core';
import { shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Colaborador, ImportarResultado, MedioPago, Permiso, Preferencias, Rol, Turno, ZonaEnvio } from '../models/admin.model';
import { ClasificacionGasto } from '../models/gasto.model';

// Cada "const obs" se suscribe acá Y en la pantalla que lo llama: sin shareReplay
// salían dos requests (dos órdenes, dos pagos). Un solo request para todos.
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  private readonly mediosPagoSignal = signal<MedioPago[]>([]);
  readonly mediosPago = this.mediosPagoSignal.asReadonly();
  private readonly turnosSignal = signal<Turno[]>([]);
  readonly turnos = this.turnosSignal.asReadonly();
  private readonly clasificacionesSignal = signal<ClasificacionGasto[]>([]);
  readonly clasificaciones = this.clasificacionesSignal.asReadonly();
  private readonly rolesSignal = signal<Rol[]>([]);
  readonly roles = this.rolesSignal.asReadonly();
  private readonly permisosSignal = signal<Permiso[]>([]);
  readonly permisos = this.permisosSignal.asReadonly();
  private readonly colaboradoresSignal = signal<Colaborador[]>([]);
  readonly colaboradores = this.colaboradoresSignal.asReadonly();
  private readonly preferenciasSignal = signal<Preferencias | null>(null);
  readonly preferencias = this.preferenciasSignal.asReadonly();
  private readonly zonasEnvioSignal = signal<ZonaEnvio[]>([]);
  readonly zonasEnvio = this.zonasEnvioSignal.asReadonly();

  cargarMediosPago(): void {
    this.http.get<MedioPago[]>(apiUrl('/v1/medios-pago')).subscribe((data) => this.mediosPagoSignal.set(data));
  }

  crearMedioPago(request: { nombre: string; esEfectivo: boolean; esCuentaCorriente: boolean; requiereReferencia: boolean }) {
    return this.http.post<MedioPago>(apiUrl('/v1/medios-pago'), request);
  }

  cargarTurnos(): void {
    this.http.get<Turno[]>(apiUrl('/v1/turnos')).subscribe((data) => this.turnosSignal.set(data));
  }

  crearTurno(request: { nombre: string; horaInicio: string; horaFin: string }) {
    return this.http.post<Turno>(apiUrl('/v1/turnos'), request);
  }

  cargarClasificaciones(): void {
    this.http.get<ClasificacionGasto[]>(apiUrl('/v1/clasificaciones-gasto')).subscribe((data) => this.clasificacionesSignal.set(data));
  }

  crearClasificacion(nombre: string) {
    return this.http.post<ClasificacionGasto>(apiUrl('/v1/clasificaciones-gasto'), { nombre });
  }

  cargarRoles(): void {
    this.http.get<Rol[]>(apiUrl('/v1/roles')).subscribe((data) => this.rolesSignal.set(data));
  }

  cargarPermisos(): void {
    this.http.get<Permiso[]>(apiUrl('/v1/permisos')).subscribe((data) => this.permisosSignal.set(data));
  }

  crearRol(nombre: string, permisos: string[]) {
    return this.http.post<Rol>(apiUrl('/v1/roles'), { nombre, permisos });
  }

  actualizarRol(id: number, nombre: string, permisos: string[]) {
    return this.http.put<Rol>(apiUrl(`/v1/roles/${id}`), { nombre, permisos });
  }

  archivarRol(id: number) {
    return this.http.delete(apiUrl(`/v1/roles/${id}`));
  }

  cargarColaboradores(): void {
    this.http.get<Colaborador[]>(apiUrl('/v1/usuarios')).subscribe((data) => this.colaboradoresSignal.set(data));
  }

  crearColaborador(request: { nombre: string; apellido: string | null; email: string; password: string | null; rolId: number }) {
    return this.http.post<Colaborador>(apiUrl('/v1/usuarios'), request);
  }

  archivarColaborador(id: number) {
    return this.http.delete(apiUrl(`/v1/usuarios/${id}`));
  }

  cargarPreferencias(): void {
    this.http.get<Preferencias>(apiUrl('/v1/preferencias')).subscribe((data) => this.preferenciasSignal.set(data));
  }

  guardarPreferencias(preferencias: Preferencias) {
    const obs = this.http.put<Preferencias>(apiUrl('/v1/preferencias'), preferencias).pipe(shareReplay(1));
    obs.subscribe((data) => this.preferenciasSignal.set(data));
    return obs;
  }

  cargarZonasEnvio(): void {
    this.http.get<ZonaEnvio[]>(apiUrl('/v1/zonas-envio')).subscribe((data) => this.zonasEnvioSignal.set(data));
  }

  crearZonaEnvio(request: { nombre: string; costo: number }) {
    return this.http.post<ZonaEnvio>(apiUrl('/v1/zonas-envio'), request);
  }

  archivarZonaEnvio(id: number) {
    return this.http.delete(apiUrl(`/v1/zonas-envio/${id}`));
  }

  importarProductos(archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<ImportarResultado>(apiUrl('/v1/productos/importar'), form);
  }
}
