import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { CategoriaGasto, ClasificacionGasto, Gasto, GastoKpis } from '../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Gasto[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly kpisSignal = signal<GastoKpis | null>(null);
  readonly kpis = this.kpisSignal.asReadonly();
  private readonly categoriasSignal = signal<CategoriaGasto[]>([]);
  readonly categorias = this.categoriasSignal.asReadonly();
  private readonly clasificacionesSignal = signal<ClasificacionGasto[]>([]);
  readonly clasificaciones = this.clasificacionesSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<Gasto[]>(apiUrl('/v1/gastos')).subscribe({
      next: (data) => {
        this.itemsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
    this.http.get<GastoKpis>(apiUrl('/v1/gastos/kpis')).subscribe((data) => this.kpisSignal.set(data));
    this.http.get<CategoriaGasto[]>(apiUrl('/v1/categorias-gasto')).subscribe((data) => this.categoriasSignal.set(data));
    this.http.get<ClasificacionGasto[]>(apiUrl('/v1/clasificaciones-gasto')).subscribe((data) => this.clasificacionesSignal.set(data));
  }

  crear(request: { proveedorId: number | null; categoriaGastoId: number; fecha: string; fechaVencimiento: string | null; monto: number; descripcion: string | null }) {
    return this.http.post<Gasto>(apiUrl('/v1/gastos'), request);
  }

  crearCategoria(request: { clasificacionId: number; nombre: string }) {
    return this.http.post<CategoriaGasto>(apiUrl('/v1/categorias-gasto'), request);
  }

  marcarPagado(id: number) {
    return this.http.patch(apiUrl(`/v1/gastos/${id}/pagar`), {});
  }
}
