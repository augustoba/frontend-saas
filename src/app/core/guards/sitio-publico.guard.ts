import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, filter, map, of, switchMap, take } from 'rxjs';
import { apiUrl } from '../config/site-config';
import { SettingsService } from '../services/settings.service';

/**
 * Las páginas públicas (catálogo, carrito, ficha...) son del ecommerce. Un punto
 * de venta no tiene sitio: su dirección lleva al panel (spec §5). Un restaurante
 * muestra su carta online (si la tiene activa; si no, también al panel). Si los
 * settings no cargan, deja pasar (el sitio decide cómo mostrar el error).
 */
export const sitioPublicoGuard: CanActivateFn = () => {
  const settings = inject(SettingsService);
  const router = inject(Router);
  const http = inject(HttpClient);
  settings.ensureLoaded();
  return toObservable(settings.status).pipe(
    filter((s) => s === 'loaded' || s === 'error'),
    take(1),
    switchMap((s): Observable<boolean | UrlTree> => {
      const sistema = settings.settings().sistema;
      if (s !== 'loaded' || sistema === 'ECOMMERCE') return of(true);
      if (sistema !== 'RESTAURANTE') return of(router.createUrlTree(['/admin']));
      return http.get<{ slug: string }>(apiUrl('/public/restaurante/carta')).pipe(
        map((c) => router.createUrlTree(['/carta', c.slug])),
        catchError(() => of(router.createUrlTree(['/admin'])))
      );
    })
  );
};
