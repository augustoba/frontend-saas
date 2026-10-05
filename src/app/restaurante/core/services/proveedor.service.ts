import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { Proveedor } from '../models/proveedor.model';
import { Gasto } from '../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Proveedor[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly gastosSinAsignarSignal = signal<Gasto[]>([]);
  readonly gastosSinAsignar = this.gastosSinAsignarSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<Proveedor[]>(apiUrl('/v1/proveedores')).subscribe({
      next: (data) => {
        this.itemsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }

  crear(request: { nombre: string; telefono: string | null; email: string | null }) {
    return this.http.post<Proveedor>(apiUrl('/v1/proveedores'), request);
  }

  eliminar(id: number) {
    return this.http.delete(apiUrl(`/v1/proveedores/${id}`));
  }

  cargarGastosSinAsignar(): void {
    this.http.get<Gasto[]>(apiUrl('/v1/gastos/sin-asignar')).subscribe((data) => this.gastosSinAsignarSignal.set(data));
  }

  asignarProveedor(gastoId: number, proveedorId: number) {
    return this.http.patch<Gasto>(apiUrl(`/v1/gastos/${gastoId}/asignar-proveedor`), { proveedorId });
  }
}
