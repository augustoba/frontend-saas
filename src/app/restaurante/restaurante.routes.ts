import { Routes } from '@angular/router';
import { RestauranteShellComponent } from './restaurante-shell.component';

/**
 * Panel del restaurante dentro del panel del SaaS (`/admin/restaurante/**`).
 * Mismas pantallas que el proyecto original (`/panel/**`), con su tema oscuro.
 */
export const RESTAURANTE_ROUTES: Routes = [
  {
    path: '',
    component: RestauranteShellComponent,
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/panel/panel.component').then((m) => m.PanelComponent), title: 'Restaurante | Admin' },
      { path: 'mesas', loadComponent: () => import('./features/mesas/mesas.component').then((m) => m.MesasComponent), title: 'Mesas | Admin' },
      { path: 'mostrador', loadComponent: () => import('./features/mostrador/mostrador.component').then((m) => m.MostradorComponent), title: 'Mostrador | Admin' },
      { path: 'cocina', loadComponent: () => import('./features/kds/kds.component').then((m) => m.KdsComponent), title: 'Cocina | Admin' },
      { path: 'comandas', loadComponent: () => import('./features/comandas/comandas.component').then((m) => m.ComandasComponent), title: 'Comandas | Admin' },
      { path: 'solicitudes', loadComponent: () => import('./features/solicitudes-mesa/solicitudes-mesa.component').then((m) => m.SolicitudesMesaComponent), title: 'Pedidos de mesas | Admin' },
      { path: 'pedidos-online', loadComponent: () => import('./features/pedidos-online/pedidos-online.component').then((m) => m.PedidosOnlineComponent), title: 'Pedidos online | Admin' },
      { path: 'caja', loadComponent: () => import('./features/caja/caja.component').then((m) => m.CajaComponent), title: 'Caja | Admin' },
      { path: 'ventas', loadComponent: () => import('./features/ventas/ventas.component').then((m) => m.VentasComponent), title: 'Ventas | Admin' },
      { path: 'productos', loadComponent: () => import('./features/productos/productos.component').then((m) => m.ProductosComponent), title: 'Carta y productos | Admin' },
      { path: 'clientes', loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponent), title: 'Clientes | Admin' },
      { path: 'reservas', loadComponent: () => import('./features/reservas/reservas.component').then((m) => m.ReservasComponent), title: 'Reservas | Admin' },
      { path: 'proveedores', loadComponent: () => import('./features/proveedores/proveedores.component').then((m) => m.ProveedoresComponent), title: 'Proveedores | Admin' },
      { path: 'gastos', loadComponent: () => import('./features/gastos/gastos.component').then((m) => m.GastosComponent), title: 'Gastos | Admin' },
      { path: 'finanzas', loadComponent: () => import('./features/finanzas/finanzas.component').then((m) => m.FinanzasComponent), title: 'Finanzas | Admin' },
      { path: 'menu-online', loadComponent: () => import('./features/menu-online/menu-online.component').then((m) => m.MenuOnlineComponent), title: 'Carta online | Admin' },
      { path: 'configuracion', loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent), title: 'Configuración del restaurante | Admin' },
    ],
  },
];
