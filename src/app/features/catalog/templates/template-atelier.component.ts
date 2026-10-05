import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogView } from '../catalog-view';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { HeroCarouselComponent } from '../../../shared/components/hero-carousel/hero-carousel.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { CldImagePipe } from '../../../shared/pipes/cld-image.pipe';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

/**
 * Diseño "Atelier": la tienda como una casa de moda. Todo lo contrario a Pop
 * y Neón: papel marfil, tinta casi negra, serif fina (Cormorant) con versalitas
 * espaciadas, filetes de un píxel, radios en cero y muchísimo aire. El contenido
 * manda: no hay una sola forma decorativa, sólo tipografía y espacio.
 *
 * Como toda plantilla es un componente tonto: recibe el `CatalogView` armado
 * y sólo lo dibuja. El color y las fuentes los pisa `[data-layout="atelier"],
 * .tpl-atelier` en `styles.css`; por eso no tiene `styleUrl`.
 */
@Component({
  selector: 'app-template-atelier',
  imports: [
    FormsModule,
    ProductCardComponent,
    HeroCarouselComponent,
    SkeletonComponent,
    CldImagePipe,
    RevealDirective,
  ],
  templateUrl: './template-atelier.component.html',
  host: {
    class: 'tpl-atelier block bg-brand-50 text-stone-800',
  },
})
export class TemplateAtelierComponent {
  readonly vm = input.required<CatalogView>();

  /**
   * La única frase del encabezado: cómo se compra de verdad, según el camino
   * que tenga configurado el local (`/api/settings`).
   */
  readonly compraLine = computed(() =>
    this.vm().settings().mercadoPagoAvailable
      ? 'Se eligen acá y se compran online con Mercado Pago.'
      : 'Se eligen acá y la compra se coordina por WhatsApp.'
  );
}
