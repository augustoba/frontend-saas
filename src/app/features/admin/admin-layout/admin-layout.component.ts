import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CldImagePipe } from '../../../shared/pipes/cld-image.pipe';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Sistema } from '../../../core/models/sistema.model';
import { Permission } from '../../../core/models/permission.model';

interface NavItem {
  path: string;
  label: string;
  /** Contador a mostrar como badge (se resuelve en el template). */
  badge?: 'pending' | 'expiringCae';
  /** Ruta exacta (para no marcar activo en sub-rutas). */
  exact?: boolean;
  /** Permiso necesario para ver el item (sin permiso = siempre visible). */
  permission?: Permission;
  /** true = sólo lo ve el superadmin, sin importar sus permisos normales. */
  superAdminOnly?: boolean;
  /**
   * Sistemas en los que aplica el item (sin valor = en todos). Ej: "Venta en el
   * local" es del ecommerce, el kiosco es del POS; ARCA o Usuarios son de todos.
   */
  sistemas?: Sistema[];
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    id: 'salon',
    label: 'Salón y cocina',
    icon: '🍽️',
    items: [
      { path: '/admin/restaurante/mesas', label: 'Mesas', permission: 'MESA_ABRIR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/mostrador', label: 'Mostrador', permission: 'ORDEN_CREAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/cocina', label: 'Cocina (KDS)', permission: 'KDS_OPERAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/comandas', label: 'Comandas', permission: 'KDS_OPERAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/solicitudes', label: 'Pedidos de las mesas', permission: 'SOLICITUD_MESA_ATENDER', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/pedidos-online', label: 'Pedidos online', permission: 'ORDEN_CREAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/reservas', label: 'Reservas', permission: 'RESERVA_VER', sistemas: ['RESTAURANTE'] },
    ],
  },
  {
    id: 'resto-caja',
    label: 'Caja y finanzas',
    icon: '💵',
    items: [
      { path: '/admin/restaurante/caja', label: 'Caja', permission: 'CAJA_VER_ARQUEO', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/ventas', label: 'Ventas', permission: 'REPORTE_VENTAS', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/gastos', label: 'Gastos', permission: 'GASTO_VER', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/finanzas', label: 'Finanzas', permission: 'REPORTE_PYL', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/clientes', label: 'Clientes', permission: 'CLIENTE_VER', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/proveedores', label: 'Proveedores', permission: 'PROVEEDOR_VER', sistemas: ['RESTAURANTE'] },
    ],
  },
  {
    id: 'resto-carta',
    label: 'Carta',
    icon: '📋',
    items: [
      { path: '/admin/restaurante/productos', label: 'Productos', permission: 'PRODUCTO_EDITAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/menu-online', label: 'Carta online', permission: 'MENU_ONLINE_CONFIGURAR', sistemas: ['RESTAURANTE'] },
      { path: '/admin/restaurante/configuracion', label: 'Salones, cajas y más', permission: 'ADMIN_CONFIGURAR', sistemas: ['RESTAURANTE'] },
    ],
  },
  {
    id: 'pos',
    label: 'Punto de venta',
    icon: '🧾',
    items: [
      { path: '/admin/pos/vender', label: 'Vender', permission: 'POS_USE', sistemas: ['POS'] },
      { path: '/admin/pos/caja', label: 'Caja', permission: 'CASH_REGISTER_VIEW', sistemas: ['POS'] },
      { path: '/admin/pos/ventas', label: 'Ventas', permission: 'POS_USE', sistemas: ['POS'] },
      { path: '/admin/pos/gastos', label: 'Gastos', permission: 'EXPENSES_MANAGE', sistemas: ['POS'] },
      { path: '/admin/pos/resultados', label: 'Resultados', permission: 'FINANCE_VIEW', sistemas: ['POS'] },
    ],
  },
  {
    id: 'articulos',
    label: 'Artículos',
    icon: '📦',
    items: [
      { path: '/admin/pos/articulos', label: 'Artículos', permission: 'PRODUCTS_VIEW', sistemas: ['POS'] },
      { path: '/admin/pos/stock', label: 'Movimientos de stock', permission: 'STOCK_MOVEMENTS_VIEW', sistemas: ['POS'] },
      { path: '/admin/pos/proveedores', label: 'Proveedores', permission: 'SUPPLIERS_MANAGE', sistemas: ['POS'] },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: '🧾',
    items: [
      { path: '/admin/pedidos', label: 'Pedidos', badge: 'pending', permission: 'ORDERS_VIEW', sistemas: ['ECOMMERCE'] },
      { path: '/admin/ventas/nueva', label: 'Venta en el local', permission: 'POS_USE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/cambios', label: 'Cambios', permission: 'EXCHANGES_USE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/caja', label: 'Caja', permission: 'CASH_REGISTER_VIEW', sistemas: ['ECOMMERCE'] },
      { path: '/admin/turnos', label: 'Turnos', permission: 'SHIFTS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/promociones', label: 'Descuentos', permission: 'DISCOUNTS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/cupones', label: 'Cupones', permission: 'COUPONS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/campanias', label: 'Campañas', permission: 'MARKETING_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/metricas', label: 'Métricas', permission: 'METRICS_VIEW', sistemas: ['ECOMMERCE'] },
      { path: '/admin/gastos', label: 'Gastos', permission: 'EXPENSES_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/balance', label: 'Balance', permission: 'FINANCE_VIEW', sistemas: ['ECOMMERCE'] },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    icon: '📦',
    items: [
      { path: '/admin/productos', label: 'Productos', permission: 'PRODUCTS_VIEW', sistemas: ['ECOMMERCE'] },
      { path: '/admin/movimientos-stock', label: 'Movimientos de stock', permission: 'STOCK_MOVEMENTS_VIEW', sistemas: ['ECOMMERCE'] },
      { path: '/admin/parametrias', label: 'Parametrías', permission: 'PARAMS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/talles', label: 'Talles', permission: 'SIZE_SCALES_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/proveedores', label: 'Proveedores', permission: 'SUPPLIERS_MANAGE', sistemas: ['ECOMMERCE'] },
    ],
  },
  {
    id: 'config',
    label: 'Configuración del sitio',
    icon: '🎨',
    items: [
      { path: '/admin/config', label: 'Vista general', exact: true, permission: 'PLATFORM_SETTINGS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/identidad', label: 'Identidad y contacto', permission: 'PLATFORM_SETTINGS_MANAGE' },
      { path: '/admin/config/whatsapp', label: 'Mensaje de WhatsApp', permission: 'PLATFORM_SETTINGS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/pagos', label: 'Medios de pago', permission: 'PAYMENTS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/mercadopago', label: 'Mercado Pago', permission: 'PAYMENTS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/arca', label: 'Facturación (ARCA)', badge: 'expiringCae', permission: 'PAYMENTS_MANAGE' },
      { path: '/admin/config/dominios', label: 'Dominios', permission: 'DOMAINS_MANAGE' },
      { path: '/admin/config/redes', label: 'Redes sociales', permission: 'PLATFORM_SETTINGS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/nosotros', label: 'Sobre nosotros', permission: 'PLATFORM_SETTINGS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/ayuda', label: 'Cómo comprar + FAQ', permission: 'PLATFORM_SETTINGS_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/config/servicios', label: 'Servicio de mail', permission: 'PLATFORM_SETTINGS_MANAGE' },
      { path: '/admin/carrusel', label: 'Carrusel', permission: 'CAROUSEL_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/inicio', label: 'Página de inicio', permission: 'CAROUSEL_MANAGE', sistemas: ['ECOMMERCE'] },
      { path: '/admin/usuarios', label: 'Usuarios y roles', permission: 'USERS_MANAGE' },
    ],
  },
  {
    id: 'superadmin',
    label: 'Superadmin',
    icon: '🔒',
    items: [
      { path: '/admin/superadmin/tiendas', label: 'Tiendas', superAdminOnly: true },
      { path: '/admin/superadmin/planes', label: 'Planes', superAdminOnly: true },
      { path: '/admin/superadmin/cloudinary', label: 'Cloudinary', superAdminOnly: true },
      { path: '/admin/superadmin/mail', label: 'Mail (SMTP)', superAdminOnly: true },
    ],
  },
];

const STORAGE_KEY = 'ep_admin_menu_open';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CldImagePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly settingsService = inject(SettingsService);
  private readonly dashboardService = inject(DashboardService);

  /** Grupos y items visibles según los permisos del usuario. */
  readonly groups = computed(() => {
    // referenciar los signals para recomputar cuando cambian
    this.authService.me();
    this.authService.permissionsUnavailable();
    const has = (p?: Permission) => !p || this.authService.has(p);
    const settings = this.settingsService.settings();
    const enSistema = (s?: Sistema[]) => !s || s.includes(settings.sistema);
    const visible = (it: NavItem) =>
      has(it.permission) && (!it.superAdminOnly || this.authService.isSuperAdmin()) && enSistema(it.sistemas);
    return GROUPS.map((g) => ({ ...g, items: g.items.filter(visible) })).filter((g) => g.items.length > 0);
  });
  readonly storeName = computed(() => this.settingsService.settings().storeName);
  /** Sólo el ecommerce tiene sitio público para "Ver tienda". */
  readonly tieneSitio = computed(() => this.settingsService.settings().sistema === 'ECOMMERCE');

  /** Nombre a mostrar arriba de todo el panel. */
  readonly displayName = this.authService.displayName;
  readonly roleLabel = computed(() => this.authService.me()?.roleName ?? '');
  readonly userInitial = computed(() => (this.displayName()[0] ?? '?').toUpperCase());
  readonly logoSrc = this.settingsService.logoSrc;
  readonly pendingOrders = this.orderService.pendingCount;
  readonly lowStockCount = this.dashboardService.lowStockCount;
  readonly expiringCaeCount = this.dashboardService.expiringCaeCount;

  /** URL actual (para saber qué grupo está activo). */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Grupos abiertos en el acordeón. */
  private readonly openGroups = signal<Set<string>>(this.readOpen());

  /** true si algún item del grupo matchea la ruta actual. */
  groupIsActive(group: NavGroup): boolean {
    const url = this.currentUrl();
    return group.items.some((it) => (it.exact ? url === it.path : url.startsWith(it.path)));
  }

  isOpen(group: NavGroup): boolean {
    return this.openGroups().has(group.id) || this.groupIsActive(group);
  }

  toggleGroup(id: string): void {
    const next = new Set(this.openGroups());
    next.has(id) ? next.delete(id) : next.add(id);
    this.openGroups.set(next);
    this.persistOpen(next);
  }

  /** Badge total del grupo cuando está colapsado. */
  groupBadge(group: NavGroup): number {
    let total = 0;
    if (group.items.some((it) => it.badge === 'pending')) total += this.pendingOrders();
    if (group.items.some((it) => it.badge === 'expiringCae')) total += this.expiringCaeCount();
    return total;
  }

  // --- Drawer mobile ---

  readonly drawerOpen = signal(false);

  constructor() {
    if (this.authService.has('ORDERS_VIEW')) this.orderService.ensureLoaded();
    if (this.authService.has('PRODUCTS_VIEW')) this.dashboardService.ensureLowStockLoaded();
    if (this.authService.has('PAYMENTS_MANAGE')) this.dashboardService.ensureExpiringCaeLoaded();
    // cerrar el menú mobile al navegar
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.drawerOpen.set(false));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private readOpen(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private persistOpen(open: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...open]));
    } catch {
      /* sin persistencia: el acordeón sigue andando en memoria */
    }
  }
}
