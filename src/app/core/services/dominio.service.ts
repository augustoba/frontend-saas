import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/site-config';

export type EstadoDominio = 'PENDIENTE' | 'ACTIVO';

export interface Dominio {
  id: string;
  host: string;
  principal: boolean;
  estado: EstadoDominio;
}

/** Lo que muestra la pantalla de dominios (ver `DominioController` en el backend). */
export interface DominiosInfo {
  /** Subdominio gratis de la tienda, ej: "ruth.miplataforma.com". */
  subdominio: string;
  /** URL con la que se arman los links (dominio principal activo, o el subdominio). */
  urlPublica: string;
  /** IP a la que tiene que apuntar el registro A; vacía en desarrollo. */
  ipServidor: string;
  dominios: Dominio[];
}

/** Dominios propios de la tienda actual (`/api/core/dominios`, permiso DOMAINS_MANAGE). */
@Injectable({ providedIn: 'root' })
export class DominioService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/core/dominios');

  listar(): Observable<DominiosInfo> {
    return this.http.get<DominiosInfo>(this.base);
  }

  agregar(host: string): Observable<Dominio> {
    return this.http.post<Dominio>(this.base, { host });
  }

  verificar(id: string): Observable<Dominio> {
    return this.http.post<Dominio>(`${this.base}/${id}/verificar`, {});
  }

  marcarPrincipal(id: string): Observable<Dominio> {
    return this.http.put<Dominio>(`${this.base}/${id}/principal`, {});
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
