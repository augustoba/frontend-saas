import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../core/config/site-config';
import {
  Articulo,
  ArticuloInput,
  Caja,
  Categoria,
  Gasto,
  GastoInput,
  MotivoStock,
  MovimientoCaja,
  MovimientoStock,
  Proveedor,
  Reporte,
  ResumenCaja,
  Venta,
  VentaInput,
} from './pos.models';

/** Cliente de `/api/pos/**`. Sin estado: cada pantalla guarda lo suyo en signals. */
@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly http = inject(HttpClient);

  // --- Artículos y stock ---

  articulos(archivados = false): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(apiUrl('/pos/articulos'), { params: { archivados } });
  }

  articuloPorCodigo(codigo: string): Observable<Articulo> {
    return this.http.get<Articulo>(apiUrl(`/pos/articulos/codigo/${encodeURIComponent(codigo)}`));
  }

  crearArticulo(input: ArticuloInput): Observable<Articulo> {
    return this.http.post<Articulo>(apiUrl('/pos/articulos'), input);
  }

  actualizarArticulo(id: string, input: ArticuloInput): Observable<Articulo> {
    return this.http.put<Articulo>(apiUrl(`/pos/articulos/${id}`), input);
  }

  archivar(id: string, archivar: boolean): Observable<Articulo> {
    return this.http.post<Articulo>(apiUrl(`/pos/articulos/${id}/${archivar ? 'archivar' : 'restaurar'}`), {});
  }

  cambiarStock(id: string, motivo: MotivoStock, cantidad: number, costoUnitario: number | null, nota: string | null): Observable<Articulo> {
    return this.http.post<Articulo>(apiUrl(`/pos/articulos/${id}/stock`), { motivo, cantidad, costoUnitario, nota });
  }

  movimientosStock(articuloId?: string): Observable<MovimientoStock[]> {
    const params = articuloId ? new HttpParams().set('articuloId', articuloId) : undefined;
    return this.http.get<MovimientoStock[]>(apiUrl('/pos/stock/movimientos'), { params });
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(apiUrl('/pos/categorias'));
  }

  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(apiUrl('/pos/categorias'), { nombre });
  }

  renombrarCategoria(id: string, nombre: string): Observable<Categoria> {
    return this.http.put<Categoria>(apiUrl(`/pos/categorias/${id}`), { nombre });
  }

  borrarCategoria(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/pos/categorias/${id}`));
  }

  // --- Caja ---

  /** La caja abierta con sus números, o null si no hay (204). */
  cajaActual(): Observable<ResumenCaja | null> {
    return this.http
      .get<ResumenCaja>(apiUrl('/pos/caja/actual'), { observe: 'response' })
      .pipe(map((r) => (r.status === 204 ? null : r.body)));
  }

  abrirCaja(montoInicial: number): Observable<ResumenCaja> {
    return this.http.post<ResumenCaja>(apiUrl('/pos/caja/abrir'), { montoInicial });
  }

  movimientoCaja(tipo: 'INGRESO' | 'EGRESO', monto: number, motivo: string): Observable<MovimientoCaja> {
    return this.http.post<MovimientoCaja>(apiUrl('/pos/caja/movimientos'), { tipo, monto, motivo });
  }

  cerrarCaja(efectivoContado: number, nota: string | null): Observable<ResumenCaja> {
    return this.http.post<ResumenCaja>(apiUrl('/pos/caja/cerrar'), { efectivoContado, nota });
  }

  cajas(): Observable<Caja[]> {
    return this.http.get<Caja[]>(apiUrl('/pos/cajas'));
  }

  caja(id: string): Observable<ResumenCaja> {
    return this.http.get<ResumenCaja>(apiUrl(`/pos/cajas/${id}`));
  }

  // --- Ventas ---

  vender(input: VentaInput): Observable<Venta> {
    return this.http.post<Venta>(apiUrl('/pos/ventas'), input);
  }

  ventas(cajaId?: string): Observable<Venta[]> {
    const params = cajaId ? new HttpParams().set('cajaId', cajaId) : undefined;
    return this.http.get<Venta[]>(apiUrl('/pos/ventas'), { params });
  }

  venta(id: string): Observable<Venta> {
    return this.http.get<Venta>(apiUrl(`/pos/ventas/${id}`));
  }

  anular(id: string, motivo: string | null): Observable<Venta> {
    return this.http.post<Venta>(apiUrl(`/pos/ventas/${id}/anular`), { motivo });
  }

  reintentarFactura(id: string): Observable<Venta> {
    return this.http.post<Venta>(apiUrl(`/pos/ventas/${id}/reintentar-factura`), {});
  }

  // --- Gastos, proveedores y reporte ---

  proveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(apiUrl('/pos/proveedores'));
  }

  guardarProveedor(id: string | null, input: Omit<Proveedor, 'id'>): Observable<Proveedor> {
    return id
      ? this.http.put<Proveedor>(apiUrl(`/pos/proveedores/${id}`), input)
      : this.http.post<Proveedor>(apiUrl('/pos/proveedores'), input);
  }

  borrarProveedor(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/pos/proveedores/${id}`));
  }

  gastos(desde: string, hasta: string): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(apiUrl('/pos/gastos'), { params: { desde, hasta } });
  }

  crearGasto(input: GastoInput): Observable<Gasto> {
    return this.http.post<Gasto>(apiUrl('/pos/gastos'), input);
  }

  borrarGasto(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/pos/gastos/${id}`));
  }

  reporte(desde: string, hasta: string): Observable<Reporte> {
    return this.http.get<Reporte>(apiUrl('/pos/reporte'), { params: { desde, hasta } });
  }
}

/** Fecha local en formato ISO (YYYY-MM-DD), para los filtros por fecha. */
export function hoyIso(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export function primeroDelMesIso(d = new Date()): string {
  return hoyIso(new Date(d.getFullYear(), d.getMonth(), 1));
}
