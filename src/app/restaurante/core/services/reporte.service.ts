import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import { ReporteProductos, ReportePropinas, ReportePyL, ReporteVentas } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);

  private readonly ventasSignal = signal<ReporteVentas | null>(null);
  readonly ventas = this.ventasSignal.asReadonly();
  private readonly propinasSignal = signal<ReportePropinas | null>(null);
  readonly propinas = this.propinasSignal.asReadonly();
  private readonly pylSignal = signal<ReportePyL | null>(null);
  readonly pyl = this.pylSignal.asReadonly();
  private readonly productosSignal = signal<ReporteProductos | null>(null);
  readonly productos = this.productosSignal.asReadonly();

  cargarVentas(desde: string, hasta: string): void {
    this.http.get<ReporteVentas>(apiUrl('/v1/reportes/ventas'), { params: { desde, hasta } }).subscribe((data) => this.ventasSignal.set(data));
  }

  cargarPropinas(desde: string, hasta: string): void {
    this.http.get<ReportePropinas>(apiUrl('/v1/reportes/propinas'), { params: { desde, hasta } }).subscribe((data) => this.propinasSignal.set(data));
  }

  cargarPyL(desde: string, hasta: string): void {
    this.http.get<ReportePyL>(apiUrl('/v1/reportes/pyl'), { params: { desde, hasta } }).subscribe((data) => this.pylSignal.set(data));
  }

  cargarProductos(desde: string, hasta: string): void {
    this.http.get<ReporteProductos>(apiUrl('/v1/reportes/productos'), { params: { desde, hasta } }).subscribe((data) => this.productosSignal.set(data));
  }
}
