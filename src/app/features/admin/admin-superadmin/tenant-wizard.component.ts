import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantAdminService, TenantRecord } from '../../../core/services/tenant-admin.service';
import { PlanAdminService } from '../../../core/services/plan-admin.service';
import { DemoTenantService } from '../../../core/services/demo-tenant.service';
import { ImagenService } from '../../../core/services/imagen.service';
import { resizeImageFile, validateImageFile } from '../../../core/utils/image-resize';
import { generateBrandRamp } from '../../../core/utils/color-ramp';
import { extractLogoColor } from '../../../core/utils/logo-color';
import { CatalogPageComponent } from '../../catalog/catalog-page/catalog-page.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { LAYOUTS, layoutSwatchVars } from '../admin-appearance/admin-appearance.component';
import { TEMPLATE_LAYOUTS, ensureLayoutFonts } from '../../../core/layouts';
import { PlanRecord } from '../../../core/services/plan-admin.service';
import { MODULE_OPTIONS } from '../../../core/models/plan-module.model';
import { SISTEMA_LABELS, SISTEMAS, Sistema } from '../../../core/models/sistema.model';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const DEFAULT_PREVIEW_COLOR = '#f97316';

export interface TenantDraft {
  name: string;
  slug: string;
  rubro: string;
}

/**
 * Asistente "Crear tienda" a pantalla completa (ver PLAN_SAAS.md Fase 10,
 * Paso 7): diseño → logo → color (con sugerencia según el logo) →
 * identidad → previsualización (pantalla completa de verdad, ESC nativo del
 * navegador para salir) → confirmar → listo. El logo va antes que el color
 * a propósito: así se le puede sugerir un color de marca sacado del logo ya
 * elegido. Todo en borrador local — no se crea nada hasta "Crear tienda" del
 * paso de confirmación, que manda todo junto en un solo alta.
 */
@Component({
  selector: 'app-tenant-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass, NgStyle, CatalogPageComponent, HeaderComponent, FooterComponent],
  templateUrl: './tenant-wizard.component.html',
})
export class TenantWizardComponent {
  private readonly tenantAdmin = inject(TenantAdminService);
  private readonly planAdmin = inject(PlanAdminService);
  private readonly demoTenant = inject(DemoTenantService);
  private readonly cloudinary = inject(ImagenService);

  readonly draft = input.required<TenantDraft>();
  readonly cancelled = output<void>();
  readonly created = output<TenantRecord>();

  readonly fullscreenHost = viewChild<ElementRef<HTMLDivElement>>('fullscreenHost');

  readonly layouts = LAYOUTS;
  /** Color original fijo de cada miniatura de diseño (Paso 1) — no depende del color en edición. */
  readonly layoutSwatchVars = layoutSwatchVars;
  readonly step = signal<WizardStep>(1);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);

  // Plan (Fase 14) — qué módulos va a tener la tienda (sitio web, punto de
  // venta, o ambos). Se elige entre los planes ya creados (ver "Planes" en
  // Superadmin) — si sólo hay uno, no hace falta elegir nada.
  readonly plans = this.planAdmin.plans;
  readonly draftPlanId = signal<string | null>(null);
  private planSeeded = false;

  // Sistema de la tienda (ecommerce, POS o restaurante): define qué planes se
  // pueden elegir — el backend rechaza un plan de otro sistema.
  readonly sistemas = SISTEMAS;
  readonly sistemaLabels = SISTEMA_LABELS;
  readonly draftSistema = signal<Sistema>('ECOMMERCE');
  /** Sólo el ecommerce tiene tienda online: los demás saltean diseño, color y vista previa. */
  readonly conSitio = computed(() => this.draftSistema() === 'ECOMMERCE');
  readonly plansDelSistema = computed(() => this.plans().filter((p) => p.sistema === this.draftSistema()));

  // Administrador inicial (opcional): con qué usuario entra el dueño a su panel.
  readonly adminNombre = signal('');
  readonly adminApellido = signal('');
  readonly adminDni = signal('');
  readonly adminEmail = signal('');
  readonly adminPassword = signal('');

  // Paso 1: diseño
  readonly draftLayout = signal('classic');
  readonly layoutLabel = computed(() => this.layouts.find((l) => l.id === this.draftLayout())?.label ?? '');

  // Paso 2: logo (va antes que el color para poder sugerirlo a partir de acá)
  /**
   * El logo NO se sube a Cloudinary al elegirlo — recién se sube en
   * `crearTienda()`, si el asistente llega hasta el final. Antes de eso
   * vive sólo en memoria como data URL (ya redimensionado, ver
   * `resizeImageFile`), que sirve a la vez de preview, de fuente para la
   * subida y para sugerir el color de marca — así no quedan imágenes
   * húerfanas en la nube si el superadmin cancela el asistente a mitad de
   * camino.
   */
  readonly logoDataUrl = signal<string | null>(null);
  readonly logoShape = signal('circle');
  readonly uploadingLogo = signal(false);

  readonly logoShapeOptions: { value: string; label: string }[] = [
    { value: 'circle', label: 'Redondo' },
    { value: 'square', label: 'Cuadrado' },
    { value: 'rectangle', label: 'Rectangular' },
  ];
  readonly logoPreviewClass = computed(() => {
    const shape = this.logoShape();
    return shape === 'square'
      ? 'rounded-lg object-cover'
      : shape === 'rectangle'
        ? 'rounded-md object-contain'
        : 'rounded-full object-cover';
  });

  // Paso 3: color
  readonly draftBrandColor = signal<string | null>(null);
  readonly draftHeaderColor = signal<string | null>(null);
  readonly draftFooterColor = signal<string | null>(null);
  readonly draftTextColor = signal<string | null>(null);
  readonly draftPageBgColor = signal<string | null>(null);
  readonly suggestingColor = signal(false);
  readonly previewVars = computed(() => {
    const ramp = generateBrandRamp(this.draftBrandColor() ?? DEFAULT_PREVIEW_COLOR);
    if (!ramp) return {};
    const vars: Record<string, string> = {};
    for (const stop of ['50', '100', '200', '300', '400', '500', '600', '700'] as const) {
      vars[`--color-brand-${stop}`] = ramp[stop];
    }
    return vars;
  });

  // Paso 4: identidad
  readonly whatsappNumber = signal('');
  readonly instagram = signal('');
  readonly facebookUrl = signal('');

  // Paso 5: previsualización a pantalla completa
  readonly fullscreenActive = signal(false);
  private awaitingFullscreenExit = false;

  constructor() {
    this.planAdmin.ensureLoaded();
    for (const l of TEMPLATE_LAYOUTS) ensureLayoutFonts(l.id);
    // Selecciona el plan "default" apenas carga la lista — sólo la primera
    // vez, para no pisar una elección manual si el listado se recarga.
    effect(() => {
      const list = this.plans();
      if (this.planSeeded || !list.length) return;
      this.planSeeded = true;
      this.draftPlanId.set(list.find((p) => p.slug === 'default')?.id ?? list[0].id);
    });
  }

  setPlan(id: string): void {
    this.draftPlanId.set(id);
  }

  /** Cambia el sistema y elige el primer plan de ese sistema (el de antes ya no aplica). */
  setSistema(s: Sistema): void {
    this.draftSistema.set(s);
    this.draftPlanId.set(this.plansDelSistema()[0]?.id ?? null);
  }

  /**
   * El admin inicial es todo o nada: vacío = sin admin; si se empezó a cargar,
   * tienen que estar todos los campos. Devuelve el mensaje de error o null.
   */
  private validarAdmin(): string | null {
    const campos = [this.adminNombre(), this.adminApellido(), this.adminDni(), this.adminEmail(), this.adminPassword()]
      .map((v) => v.trim());
    if (campos.every((v) => !v)) return null;
    if (campos.some((v) => !v)) return 'Para crear el administrador completá todos sus datos (o dejalos todos vacíos).';
    if (!/^\d{6,20}$/.test(campos[2])) return 'El DNI del administrador tiene que ser sólo números.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campos[3])) return 'El email del administrador no es válido.';
    if (campos[4].length < 4) return 'La contraseña del administrador tiene que tener al menos 4 caracteres.';
    return null;
  }

  /** "Sitio web, Mercado Pago, Punto de venta…" — para distinguir planes de un vistazo. */
  planModuleSummary(plan: PlanRecord): string {
    const labels = MODULE_OPTIONS.filter((m) => plan.enabledModules.includes(m.key)).map((m) => m.label);
    return labels.length ? labels.join(' · ') : 'Sin módulos';
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement) {
      this.fullscreenActive.set(false);
      if (this.awaitingFullscreenExit) {
        this.awaitingFullscreenExit = false;
        this.step.set(6);
      }
    }
  }

  chooseLayout(id: string): void {
    this.draftLayout.set(id);
  }

  setBrandColor(hex: string): void {
    this.draftBrandColor.set(hex);
  }

  clearBrandColor(): void {
    this.draftBrandColor.set(null);
  }

  setHeaderColor(hex: string): void {
    this.draftHeaderColor.set(hex);
  }
  clearHeaderColor(): void {
    this.draftHeaderColor.set(null);
  }

  setFooterColor(hex: string): void {
    this.draftFooterColor.set(hex);
  }
  clearFooterColor(): void {
    this.draftFooterColor.set(null);
  }

  setTextColor(hex: string): void {
    this.draftTextColor.set(hex);
  }
  clearTextColor(): void {
    this.draftTextColor.set(null);
  }

  setPageBgColor(hex: string): void {
    this.draftPageBgColor.set(hex);
  }
  clearPageBgColor(): void {
    this.draftPageBgColor.set(null);
  }

  /** Sugiere el color de marca a partir del logo ya elegido (todavía en memoria, sin subir). */
  async suggestColorFromLogo(): Promise<void> {
    const dataUrl = this.logoDataUrl();
    if (!dataUrl || this.suggestingColor()) return;
    this.suggestingColor.set(true);
    try {
      const color = await extractLogoColor(dataUrl);
      if (color) {
        this.draftBrandColor.set(color);
      } else {
        this.error.set('No se pudo sacar un color claro del logo — elegilo a mano.');
      }
    } finally {
      this.suggestingColor.set(false);
    }
  }

  back(): void {
    this.error.set(null);
    this.step.update((s) => {
      if (s <= 1) return s;
      let prev = s - 1;
      if (!this.conSitio() && (prev === 5 || prev === 3)) prev--;
      return prev as WizardStep;
    });
  }

  goToLogo(): void {
    this.step.set(2);
  }

  goToColor(): void {
    this.step.set(this.conSitio() ? 3 : 4);
  }

  goToIdentity(): void {
    this.step.set(4);
  }

  goToPreview(): void {
    this.error.set(null);
    if (this.whatsappNumber().trim() && !/^\d{8,15}$/.test(this.whatsappNumber().trim())) {
      this.error.set('El WhatsApp tiene que ser solo números (país + área + número, sin +, espacios ni el 15).');
      return;
    }
    this.step.set(this.conSitio() ? 5 : 6);
  }

  async enterFullscreen(): Promise<void> {
    const el = this.fullscreenHost()?.nativeElement;
    if (!el) return;
    try {
      await el.requestFullscreen();
      this.fullscreenActive.set(true);
      this.awaitingFullscreenExit = true;
    } catch {
      // Si el navegador no permite fullscreen (poco común), seguimos igual al confirmar.
      this.step.set(6);
    }
  }

  skipPreview(): void {
    this.step.set(6);
  }

  /** Sólo redimensiona y arma una preview local — no toca la red. */
  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      this.error.set(invalid);
      return;
    }

    this.error.set(null);
    this.uploadingLogo.set(true);
    try {
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const resized = await resizeImageFile(file, 512, 0.9, type);
      this.logoDataUrl.set(resized);
    } catch (e) {
      this.error.set(e instanceof Error ? `No se pudo procesar el logo: ${e.message}` : 'No se pudo procesar el logo.');
    } finally {
      this.uploadingLogo.set(false);
    }
  }

  removeLogo(): void {
    this.logoDataUrl.set(null);
  }

  /**
   * Recién acá se sube el logo a Cloudinary (si se eligió uno) — hasta este
   * momento vivió sólo en memoria, para no dejar imágenes húerfanas en la
   * nube si el asistente se cancela antes de llegar a este paso.
   */
  async crearTienda(): Promise<void> {
    if (this.creating()) return;
    this.error.set(null);
    const adminError = this.validarAdmin();
    if (adminError) {
      this.error.set(adminError);
      return;
    }
    this.creating.set(true);

    let logoUrl: string | undefined;
    const dataUrl = this.logoDataUrl();
    if (dataUrl) {
      if (!this.cloudinary.configured) {
        this.creating.set(false);
        this.error.set('La subida de imágenes todavía no está configurada.');
        return;
      }
      try {
        const { secureUrl } = await this.cloudinary.upload(dataUrl, {
          folder: 'logo',
          publicId: 'logo',
          // La tienda todavía no existe: el superadmin sube a su carpeta de antemano.
          slugTienda: this.draft().slug,
        });
        logoUrl = secureUrl;
      } catch (e) {
        this.creating.set(false);
        this.error.set(e instanceof Error ? `No se pudo subir el logo: ${e.message}` : 'No se pudo subir el logo.');
        return;
      }
    }

    const d = this.draft();
    this.tenantAdmin.create(
      {
        name: d.name,
        slug: d.slug,
        rubro: d.rubro,
        layout: this.draftLayout(),
        brandColor: this.draftBrandColor() ?? undefined,
        headerColor: this.draftHeaderColor() ?? undefined,
        footerColor: this.draftFooterColor() ?? undefined,
        textColor: this.draftTextColor() ?? undefined,
        pageBackgroundColor: this.draftPageBgColor() ?? undefined,
        whatsappNumber: this.whatsappNumber().trim() || undefined,
        instagram: this.instagram().trim() || undefined,
        facebookUrl: this.facebookUrl().trim() || undefined,
        logoUrl,
        logoShape: this.logoShape(),
        planId: this.draftPlanId() ?? undefined,
        sistema: this.draftSistema(),
        admin: this.adminDni().trim()
          ? {
              nombre: this.adminNombre().trim(),
              apellido: this.adminApellido().trim(),
              dni: this.adminDni().trim(),
              email: this.adminEmail().trim(),
              password: this.adminPassword(),
            }
          : undefined,
      },
      (tenant) => {
        this.creating.set(false);
        this.logoDataUrl.set(null);
        this.demoTenant.view(tenant.slug);
        this.created.emit(tenant);
        this.step.set(7);
      },
      (message) => {
        this.creating.set(false);
        this.error.set(message || 'No se pudo crear la tienda. Revisá el identificador (puede que ya exista).');
      }
    );
  }

  verPagina(): void {
    window.open('/', '_blank');
  }

  cancel(): void {
    if (document.fullscreenElement) document.exitFullscreen();
    this.logoDataUrl.set(null);
    this.cancelled.emit();
  }
}
