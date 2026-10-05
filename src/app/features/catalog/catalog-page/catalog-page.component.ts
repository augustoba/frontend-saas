import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { HeroCarouselComponent } from '../../../shared/components/hero-carousel/hero-carousel.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ProductService } from '../../../core/services/product.service';
import { ParamService } from '../../../core/services/param.service';
import { SizeScaleService } from '../../../core/services/size-scale.service';
import { SettingsService } from '../../../core/services/settings.service';
import { GENERIC_LOGO_PLACEHOLDER } from '../../../core/utils/generic-logo';
import { HeroSlidesService } from '../../../core/services/hero-slides.service';
import { PageBlocksService } from '../../../core/services/page-blocks.service';
import { Product, productHasParam } from '../../../core/models/product.model';
import { PAYMENT_LABELS } from '../../../core/models/order.model';
import { Discount, DiscountKind } from '../../../core/models/discount.model';
import { DiscountService } from '../../../core/services/discount.service';
import { isTemplateLayout } from '../../../core/layouts';
import { CatalogView, PromoLine, SortOrder } from '../catalog-view';
import { TEMPLATE_COMPONENTS } from '../templates/template-components';

@Component({
  selector: 'app-catalog-page',
  imports: [FormsModule, RouterLink, ProductCardComponent, HeroCarouselComponent, SkeletonComponent, LogoComponent, TEMPLATE_COMPONENTS],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  host: { '[style.background-color]': 'pageBg()' },
})
export class CatalogPageComponent implements CatalogView {
  private readonly productService = inject(ProductService);
  private readonly paramService = inject(ParamService);
  private readonly sizeScaleService = inject(SizeScaleService);
  private readonly settingsService = inject(SettingsService);
  private readonly heroSlidesService = inject(HeroSlidesService);
  private readonly pageBlocksService = inject(PageBlocksService);
  private readonly discountService = inject(DiscountService);

  /**
   * `undefined` = usar el nombre de `SiteSettings` de siempre; string = el
   * que se está escribiendo en el asistente "Crear tienda" (tienda que
   * todavía no existe, no tiene fila en `SiteSettings`).
   */
  readonly storeNameOverride = input<string | undefined>(undefined);
  readonly storeName = computed(
    () => this.storeNameOverride() ?? this.settingsService.settings().storeName
  );
  /**
   * `undefined` = usar el logo de `SiteSettings` de siempre; string (incluida
   * una data URL) u null = el que mande el asistente "Crear tienda", que
   * todavía no subió nada a Cloudinary (ver `TenantWizardComponent.logoDataUrl`).
   */
  readonly logoOverride = input<string | null | undefined>(undefined);
  readonly logoSrc = computed(() =>
    this.logoOverride() !== undefined
      ? this.logoOverride() || GENERIC_LOGO_PLACEHOLDER
      : this.settingsService.logoSrc()
  );
  /**
   * Fuerza un layout puntual sin importar el de `SiteSettings` — sólo lo usa
   * la miniatura de "Apariencia" (`admin-appearance`) para mostrar cada
   * opción con el componente real. Ver PLAN_SAAS.md Fase 10.
   */
  readonly layoutOverride = input<string | undefined>(undefined);
  /**
   * Igual que `layoutOverride` pero para los 2 colores granulares que se
   * pintan dentro de esta misma página (texto de títulos y fondo general —
   * ver PLAN_SAAS.md Fase 10 ampliada): `undefined` = usar `SiteSettings`
   * de siempre; string u null = lo que mande el borrador de "Apariencia".
   */
  readonly textColorOverride = input<string | null | undefined>(undefined);
  readonly pageBgOverride = input<string | null | undefined>(undefined);
  readonly footerColorOverride = input<string | null | undefined>(undefined);
  readonly headingColor = computed(() =>
    this.textColorOverride() !== undefined ? this.textColorOverride() : this.settingsService.settings().textColor
  );
  readonly pageBg = computed(() =>
    this.pageBgOverride() !== undefined ? this.pageBgOverride() : this.settingsService.settings().pageBackgroundColor
  );
  /**
   * Layout de página elegido (ver PLAN_SAAS.md Fase 10) — eje independiente
   * de la paleta/theme. Hoy sólo cambia la sección de portada y la grilla
   * (ver el template): el resto de la lógica de catálogo es la misma para
   * cualquier layout.
   */
  readonly layout = computed(() => this.layoutOverride() ?? this.settingsService.settings().layout);
  /**
   * true = el diseño es una de las plantillas con componente propio
   * (`core/layouts.ts`, traídas del ecommerce de Ruth): la home entera la
   * dibuja ese componente con `vm`, en vez de las ramas `@if` del template.
   */
  readonly isTemplateLayout = computed(() => isTemplateLayout(this.layout()));

  /**
   * Modo miniatura: pocas prendas y sin "lo más vendido". Lo usan las
   * miniaturas de "Apariencia" y del asistente "Crear tienda", que muestran
   * todos los diseños a la vez — sin este recorte cada una dibujaría el
   * catálogo completo.
   */
  readonly preview = input(false);

  /** Se pasa a las plantillas como un único view-model. */
  readonly vm: CatalogView = this;

  /** Todos los datos del local: "sobre nosotros", dirección, redes, medios de pago. */
  readonly settings = this.settingsService.settings;

  /**
   * Promos vigentes con el texto ya armado, para las plantillas que tienen
   * barra de ofertas. Sale de `/api/discounts` (público); "vigente" lo decide
   * el backend (`status === 'ACTIVO'`) y si el campo no viene se cae a
   * `enabled`. Orden por tipo, no por fecha, para que la barra no salte.
   */
  readonly promos = computed<PromoLine[]>(() =>
    this.discountService
      .discounts()
      .filter((d) => (d.status ? d.status === 'ACTIVO' : d.enabled))
      .sort((a, b) => PROMO_ORDER.indexOf(a.kind) - PROMO_ORDER.indexOf(b.kind))
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        text: this.promoText(d),
        detail: d.detail?.trim() || null,
        percent: d.discountPercent,
        endsLabel: promoEndsLabel(d.endsAt),
      }))
  );

  /** Frase de una promo: el texto que cargó el dueño o, si no puso, uno armado con sus datos. */
  private promoText(d: Discount): string {
    const label = d.label?.trim();
    if (label) return label;
    switch (d.kind) {
      case 'MONTO':
        return `Compra mayor a ${formatArs(d.minAmount ?? 0)} → ${d.discountPercent}% off`;
      case 'ENVIO_GRATIS':
        return `Envío gratis desde ${formatArs(d.minAmount ?? 0)}`;
      case 'PARAMETRO': {
        const opt = this.paramService.labelFor(d.groupId ?? '', d.optionId ?? '');
        return `${opt || 'Selección'} ${d.discountPercent}% off`;
      }
      case 'PAGO': {
        const names = (d.paymentMethods ?? []).map((m) => PAYMENT_LABELS[m]).join(' o ');
        return `${d.discountPercent}% pagando con ${names || 'el medio que elijas'}`;
      }
      default:
        return `${d.discountPercent}% off`;
    }
  }

  discountPercentFor(product: Product): number {
    return this.discountService.percentForProduct(product);
  }

  /**
   * `layout()` acotado a las variantes que conoce `ProductCardComponent`
   * (fallback: `'classic'`) — `"boutique"` (Minna) usa la tarjeta `"editorial"`
   * (foto lisa, sin marco); el resto de los layouts usan la tarjeta clásica.
   */
  readonly cardVariant = computed<'classic' | 'editorial' | 'marketplace'>(() =>
    this.layout() === 'boutique' ? 'editorial' : 'classic'
  );
  /** Columnas de la grilla de producto — igual para todos los layouts hoy. */
  readonly gridColsClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6';

  /**
   * Primeras 3 opciones de parametría (cualquier grupo), para las tarjetas
   * de promo del layout `"mercado"` (Shopping Cart / Big Store / Online
   * Shop) — datos reales del catálogo, no inventados.
   */
  readonly topOptions = computed(() => {
    const out: { groupId: string; id: string; label: string }[] = [];
    for (const g of this.filterGroups()) {
      for (const o of g.options) {
        out.push({ groupId: g.id, id: o.id, label: o.label });
        if (out.length >= 3) return out;
      }
    }
    return out;
  });

  /** Fotos del carrusel de bienvenida — administrables desde /admin/carrusel */
  readonly heroSlides = this.heroSlidesService.slides;
  /** Bloques habilitados (ver PLAN_SAAS.md Fase 7) — personalizador visual. */
  readonly heroBlockVisible = this.pageBlocksService.isVisible('HERO');
  readonly featuredBlockVisible = this.pageBlocksService.isVisible('FEATURED_PRODUCTS');

  readonly catalogStatus = this.productService.catalogStatus;
  readonly reloadCatalog = () => this.productService.reloadCatalog();
  /** Los más vendidos — se muestran arriba de la grilla si no hay filtros activos. */
  readonly bestSellers = computed<Product[]>(() =>
    this.preview() ? [] : this.productService.bestSellers()
  );

  /** Grupos de parametrías que se muestran como filtro */
  readonly filterGroups = this.paramService.catalogGroups;
  /** Grupo "Público": se muestra como botones; el resto como selectores */
  readonly publicoGroup = computed(() =>
    this.filterGroups().find((g) => g.id === 'grp-publico')
  );
  readonly selectGroups = computed(() =>
    this.filterGroups().filter((g) => g.id !== 'grp-publico')
  );

  /**
   * Talles que existen en el catálogo, ordenados según el orden en que aparecen
   * en las escalas de talle (y al final los que no están en ninguna).
   */
  readonly availableSizes = computed(() => {
    const present = new Set<string>();
    for (const p of this.productService.availableProducts()) {
      for (const s of p.sizeStocks) present.add(s.size);
    }
    const ordered: string[] = [];
    for (const scale of this.sizeScaleService.scales()) {
      for (const v of scale.values) {
        if (present.has(v) && !ordered.includes(v)) ordered.push(v);
      }
    }
    for (const v of present) {
      if (!ordered.includes(v)) ordered.push(v);
    }
    return ordered;
  });

  readonly searchTerm = signal('');
  readonly selectedSize = signal<string>('todos');
  /** { [groupId]: optionId } — sin entrada o '' significa "todas" */
  readonly selectedParams = signal<Record<string, string>>({});
  /** Rango de precio (ARS). null = sin límite. */
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  /** Orden de la grilla: 'novedades' respeta el orden del backend (más nuevos primero). */
  readonly sortBy = signal<SortOrder>('novedades');

  setMinPrice(value: string): void {
    const n = Number(value);
    this.minPrice.set(value === '' || !Number.isFinite(n) || n < 0 ? null : n);
  }
  setMaxPrice(value: string): void {
    const n = Number(value);
    this.maxPrice.set(value === '' || !Number.isFinite(n) || n < 0 ? null : n);
  }

  readonly hasActiveFilters = computed(
    () =>
      !!this.searchTerm() ||
      this.selectedSize() !== 'todos' ||
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      Object.values(this.selectedParams()).some((v) => !!v)
  );

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const size = this.selectedSize();
    const params = this.selectedParams();
    const min = this.minPrice();
    const max = this.maxPrice();

    const list = this.productService.availableProducts().filter((product) => {
      const matchesTerm = !term || product.name.toLowerCase().includes(term);
      const matchesSize = size === 'todos' || product.sizeStocks.some((s) => s.size === size);
      const matchesParams = Object.entries(params).every(
        ([groupId, optionId]) => !optionId || productHasParam(product, groupId, optionId)
      );
      const matchesPrice =
        (min === null || product.price >= min) && (max === null || product.price <= max);
      return matchesTerm && matchesSize && matchesParams && matchesPrice;
    });

    const sort = this.sortBy();
    if (sort === 'precio-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'precio-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  });

  /** Paginación client-side: cuántos productos se muestran (crece con "Ver más"). */
  private readonly PAGE_SIZE = 12;
  /** En miniatura alcanzan unas pocas prendas para que se vea cómo arma la grilla. */
  private readonly PREVIEW_SIZE = 4;
  readonly shownCount = signal(this.PAGE_SIZE);
  readonly visibleProducts = computed(() =>
    this.filteredProducts().slice(0, this.preview() ? this.PREVIEW_SIZE : this.shownCount())
  );
  readonly hasMore = computed(
    () => !this.preview() && this.filteredProducts().length > this.shownCount()
  );
  showMore(): void {
    this.shownCount.update((n) => n + this.PAGE_SIZE);
  }

  constructor() {
    // Al cambiar cualquier filtro/orden, volver a la primera "página".
    effect(() => {
      this.searchTerm();
      this.selectedSize();
      this.selectedParams();
      this.minPrice();
      this.maxPrice();
      this.sortBy();
      this.shownCount.set(this.PAGE_SIZE);
    });
  }

  paramValue(groupId: string): string {
    return this.selectedParams()[groupId] ?? '';
  }

  setParam(groupId: string, optionId: string): void {
    this.selectedParams.update((current) => {
      const next = { ...current };
      if (!optionId || next[groupId] === optionId) {
        delete next[groupId];
      } else {
        next[groupId] = optionId;
      }
      return next;
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSize.set('todos');
    this.selectedParams.set({});
    this.minPrice.set(null);
    this.maxPrice.set(null);
  }

  /** Baja con scroll suave a la grilla del catálogo (evita el salto raro del `href="#..."`). */
  scrollToCatalog(): void {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/** Orden fijo de la barra de promos: por tipo, no por cuándo se cargó cada una. */
const PROMO_ORDER: DiscountKind[] = ['MONTO', 'ENVIO_GRATIS', 'PARAMETRO', 'PAGO'];

/**
 * "Hasta el 15/10" a partir de la fecha de fin (`YYYY-MM-DD`). Se corta el
 * string a mano y no con `new Date()`: `new Date('2026-10-15')` es medianoche
 * UTC y en Argentina (UTC-3) cae el 14.
 */
function promoEndsLabel(endsAt: string | null | undefined): string | null {
  const iso = endsAt?.trim();
  if (!iso) return null;
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return null;
  return `Hasta el ${day}/${month}`;
}

function formatArs(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-AR');
}
