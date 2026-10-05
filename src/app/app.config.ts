import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { demoTenantInterceptor } from './core/http/demo-tenant.interceptor';
import { StoreTitleStrategy } from './core/store-title.strategy';

registerLocaleData(localeEsAr, 'es-AR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor, demoTenantInterceptor, errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    CurrencyPipe,
    // "Página | Nombre de la tienda" con el nombre real de /api/settings (de Ruth).
    { provide: TitleStrategy, useClass: StoreTitleStrategy },
  ],
};
