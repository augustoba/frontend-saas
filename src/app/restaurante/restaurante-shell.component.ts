import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Las pantallas del restaurante conservan el tema oscuro del sistema original
 * (calcado de Restolia): este contenedor le da su fondo y color de texto dentro
 * del panel del SaaS, que es claro.
 */
@Component({
  selector: 'app-restaurante-shell',
  imports: [RouterOutlet],
  template: `<div class="restaurante-tema bg-surface text-ink -m-4 sm:-m-8 p-4 sm:p-6 min-h-[calc(100vh-2.75rem)]"><router-outlet /></div>`,
})
export class RestauranteShellComponent {}
