import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import {
  Categoria,
  GrupoModificador,
  InventarioItem,
  ListaPrecio,
  ListaPrecioItem,
  MovimientoStock,
  Producto,
  ProductoRequest,
  TipoMovimientoStock,
} from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<Producto[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  private readonly categoriasSignal = signal<Categoria[]>([]);
  readonly categorias = this.categoriasSignal.asReadonly();
  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly gruposSignal = signal<GrupoModificador[]>([]);
  readonly grupos = this.gruposSignal.asReadonly();

  private readonly listasSignal = signal<ListaPrecio[]>([]);
  readonly listas = this.listasSignal.asReadonly();

  private readonly movimientosSignal = signal<MovimientoStock[]>([]);
  readonly movimientos = this.movimientosSignal.asReadonly();

  private readonly inventarioSignal = signal<InventarioItem[]>([]);
  readonly inventario = this.inventarioSignal.asReadonly();

  cargar(): void {
    this.loadingSignal.set(true);
    this.http.get<Producto[]>(apiUrl('/v1/productos')).subscribe({
      next: (data) => {
        this.itemsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.http.get<Categoria[]>(apiUrl('/v1/categorias')).subscribe((data) => this.categoriasSignal.set(data));
  }

  crearCategoria(nombre: string, orden: number) {
    return this.http.post<Categoria>(apiUrl('/v1/categorias'), { nombre, orden });
  }

  crear(request: ProductoRequest) {
    return this.http.post<Producto>(apiUrl('/v1/productos'), request);
  }

  actualizar(id: number, request: ProductoRequest) {
    return this.http.put<Producto>(apiUrl(`/v1/productos/${id}`), request);
  }

  cambiarDisponibilidad(id: number, disponible: boolean) {
    return this.http.patch(apiUrl(`/v1/productos/${id}/disponibilidad`), { disponible });
  }

  archivar(id: number) {
    return this.http.delete(apiUrl(`/v1/productos/${id}`));
  }

  // --- Grupos de modificadores ---
  cargarGrupos(): void {
    this.http.get<GrupoModificador[]>(apiUrl('/v1/grupos-modificadores')).subscribe((data) => this.gruposSignal.set(data));
  }

  crearGrupo(request: { nombre: string; obligatorio: boolean; multiple: boolean; min: number | null; max: number | null }) {
    return this.http.post<GrupoModificador>(apiUrl('/v1/grupos-modificadores'), request);
  }

  actualizarGrupo(id: number, request: { nombre: string; obligatorio: boolean; multiple: boolean; min: number | null; max: number | null }) {
    return this.http.put<GrupoModificador>(apiUrl(`/v1/grupos-modificadores/${id}`), request);
  }

  archivarGrupo(id: number) {
    return this.http.delete(apiUrl(`/v1/grupos-modificadores/${id}`));
  }

  agregarModificador(grupoId: number, nombre: string, precioAdicional: number | null) {
    return this.http.post(apiUrl(`/v1/grupos-modificadores/${grupoId}/modificadores`), { nombre, precioAdicional });
  }

  eliminarModificador(grupoId: number, id: number) {
    return this.http.delete(apiUrl(`/v1/grupos-modificadores/${grupoId}/modificadores/${id}`));
  }

  asignarGrupos(productoId: number, grupoIds: number[]) {
    return this.http.put(apiUrl(`/v1/productos/${productoId}/grupos-modificadores`), { grupoIds });
  }

  // --- Listas de precio ---
  cargarListas(): void {
    this.http.get<ListaPrecio[]>(apiUrl('/v1/listas-precio')).subscribe((data) => this.listasSignal.set(data));
  }

  crearLista(nombre: string, descripcion: string | null) {
    return this.http.post<ListaPrecio>(apiUrl('/v1/listas-precio'), { nombre, descripcion });
  }

  archivarLista(id: number) {
    return this.http.delete(apiUrl(`/v1/listas-precio/${id}`));
  }

  listarItemsLista(listaId: number) {
    return this.http.get<ListaPrecioItem[]>(apiUrl(`/v1/listas-precio/${listaId}/items`));
  }

  upsertItemLista(listaId: number, productoId: number, precio: number) {
    return this.http.post<ListaPrecioItem>(apiUrl(`/v1/listas-precio/${listaId}/items`), { productoId, precio });
  }

  eliminarItemLista(listaId: number, itemId: number) {
    return this.http.delete(apiUrl(`/v1/listas-precio/${listaId}/items/${itemId}`));
  }

  // --- Movimientos de stock / Inventario ---
  cargarMovimientos(): void {
    this.http.get<MovimientoStock[]>(apiUrl('/v1/movimientos-stock')).subscribe((data) => this.movimientosSignal.set(data));
  }

  cargarInventario(): void {
    this.http.get<InventarioItem[]>(apiUrl('/v1/inventario')).subscribe((data) => this.inventarioSignal.set(data));
  }

  registrarMovimiento(productoId: number, tipo: TipoMovimientoStock, cantidad: number, motivo: string | null) {
    return this.http.post<MovimientoStock>(apiUrl('/v1/movimientos-stock'), { productoId, tipo, cantidad, motivo });
  }
}
