import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SettingsService } from '../services/settings.service';

/**
 * Las páginas públicas (catálogo, carrito, ficha...) son del ecommerce. Un punto
 * de venta no tiene sitio: su dirección lleva al panel (spec §5). Si los
 * settings no cargan, deja pasar (el sitio decide cómo mostrar el error).
 */
export const sitioPublicoGuard: CanActivateFn = () => {
  const settings = inject(SettingsService);
  const router = inject(Router);
  settings.ensureLoaded();
  return toObservable(settings.status).pipe(
    filter((s) => s === 'loaded' || s === 'error'),
    take(1),
    map((s) => (s === 'loaded' && settings.settings().sistema !== 'ECOMMERCE' ? router.createUrlTree(['/admin']) : true))
  );
};
