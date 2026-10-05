import { Injectable, inject, signal } from '@angular/core';
import { shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../config/site-config';
import {
  AnaliticaProducto,
  CartaPublica,
  ComentarioAdmin,
  ComentarioProducto,
  MenuOnlineConfig,
  ProductoDetallePublico,
} from '../models/menu-online.model';

// Cada "const obs" se suscribe acá Y en la pantalla que lo llama: sin shareReplay
// salían dos requests (dos órdenes, dos pagos). Un solo request para todos.
@Injectable({ providedIn: 'root' })
export class MenuOnlineService {
  private readonly http = inject(HttpClient);

  private readonly configSignal = signal<MenuOnlineConfig | null>(null);
  readonly config = this.configSignal.asReadonly();

  private readonly analiticasSignal = signal<AnaliticaProducto[]>([]);
  readonly analiticas = this.analiticasSignal.asReadonly();

  private readonly comentariosSignal = signal<ComentarioAdmin[]>([]);
  readonly comentariosAdmin = this.comentariosSignal.asReadonly();

  cargar() {
    const obs = this.http.get<MenuOnlineConfig>(apiUrl('/v1/menu-online/config')).pipe(shareReplay(1));
    obs.subscribe((data) => this.configSignal.set(data));
    return obs;
  }

  guardar(request: Omit<MenuOnlineConfig, 'slug' | 'logoUrl'>) {
    return this.http.put<MenuOnlineConfig>(apiUrl('/v1/menu-online/config'), request);
  }

  cargarAnaliticas(): void {
    this.http.get<AnaliticaProducto[]>(apiUrl('/v1/menu-online/analiticas')).subscribe((data) => this.analiticasSignal.set(data));
  }

  cargarComentariosAdmin(): void {
    this.http.get<ComentarioAdmin[]>(apiUrl('/v1/menu-online/comentarios')).subscribe((data) => this.comentariosSignal.set(data));
  }

  eliminarComentarioAdmin(id: number) {
    return this.http.delete(apiUrl(`/v1/menu-online/comentarios/${id}`));
  }

  cartaPublica(slug: string) {
    return this.http.get<CartaPublica>(apiUrl(`/v1/carta/${slug}`));
  }

  detalleProducto(slug: string, productoId: number) {
    return this.http.get<ProductoDetallePublico>(apiUrl(`/v1/carta/${slug}/productos/${productoId}`));
  }

  darLike(slug: string, productoId: number) {
    return this.http.post<{ likes: number }>(apiUrl(`/v1/carta/${slug}/productos/${productoId}/like`), {});
  }

  comentar(slug: string, productoId: number, nombreCliente: string, texto: string) {
    return this.http.post<ComentarioProducto>(apiUrl(`/v1/carta/${slug}/productos/${productoId}/comentarios`), { nombreCliente, texto });
  }
}
