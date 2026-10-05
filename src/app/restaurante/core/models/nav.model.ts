export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/**
 * Mismo orden que el sidebar real (relevado en vivo en demo.restolia.com).
 * "Órdenes" es la pantalla de mesas/plano de salón — no son dos ítems
 * separados como sugería el relevamiento original por capturas mobile.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: '/admin/restaurante', label: 'Panel', icon: 'grid' },
  { path: '/admin/restaurante/mesas', label: 'Órdenes', icon: 'fork' },
  { path: '/admin/restaurante/mostrador', label: 'Mostrador', icon: 'card' },
  { path: '/admin/restaurante/pedidos-online', label: 'Pedidos Online', icon: 'chat' },
  { path: '/admin/restaurante/ventas', label: 'Ventas', icon: 'dollar' },
  { path: '/admin/restaurante/gastos', label: 'Gastos', icon: 'receipt' },
  { path: '/admin/restaurante/finanzas', label: 'Finanzas P&L', icon: 'chart' },
  { path: '/admin/restaurante/productos', label: 'Productos', icon: 'pizza' },
  { path: '/admin/restaurante/caja', label: 'Caja', icon: 'register' },
  { path: '/admin/restaurante/clientes', label: 'Clientes', icon: 'users' },
  { path: '/admin/restaurante/reservas', label: 'Reservas', icon: 'calendar' },
  { path: '/admin/restaurante/proveedores', label: 'Proveedores', icon: 'truck' },
  { path: '/admin/restaurante/menu-online', label: 'Menú Online', icon: 'globe' },
  { path: '/admin/restaurante/admin', label: 'Admin', icon: 'gear' },
];

/**
 * Módulos nuevos que todavía se están probando, mostrados aparte al pie
 * del sidebar (separados por una línea) para no mezclarlos con el flujo
 * ya afianzado — mismo criterio pedido por el usuario para "Cocina"
 * (Fase 18, vista de comandas completas: mesa + mostrador + online).
 */
export const NAV_ITEMS_EXPERIMENTALES: NavItem[] = [
  { path: '/admin/restaurante/comandas', label: 'Cocina', icon: 'flame' },
];
