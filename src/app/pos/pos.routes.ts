import { Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/admin.guard';

/** Pantallas del punto de venta, dentro del marco del panel (`/admin/pos/**`). */
export const POS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vender' },
  {
    path: 'vender',
    canActivate: [permissionGuard],
    data: { permission: 'POS_USE' },
    loadComponent: () => import('./admin/pos-vender/pos-vender.component').then((m) => m.PosVenderComponent),
    title: 'Vender | Admin',
  },
  {
    path: 'caja',
    canActivate: [permissionGuard],
    data: { permission: 'CASH_REGISTER_VIEW' },
    loadComponent: () => import('./admin/pos-caja/pos-caja.component').then((m) => m.PosCajaComponent),
    title: 'Caja | Admin',
  },
  {
    path: 'cajas/:id',
    canActivate: [permissionGuard],
    data: { permission: 'CASH_REGISTER_VIEW' },
    loadComponent: () => import('./admin/pos-caja/pos-caja.component').then((m) => m.PosCajaComponent),
    title: 'Caja | Admin',
  },
  {
    path: 'ventas',
    canActivate: [permissionGuard],
    data: { permission: 'POS_USE' },
    loadComponent: () => import('./admin/pos-ventas/pos-ventas.component').then((m) => m.PosVentasComponent),
    title: 'Ventas | Admin',
  },
  {
    path: 'articulos',
    canActivate: [permissionGuard],
    data: { permission: 'PRODUCTS_VIEW' },
    loadComponent: () => import('./admin/pos-articulos/pos-articulos.component').then((m) => m.PosArticulosComponent),
    title: 'Artículos | Admin',
  },
  {
    path: 'stock',
    canActivate: [permissionGuard],
    data: { permission: 'STOCK_MOVEMENTS_VIEW' },
    loadComponent: () => import('./admin/pos-stock/pos-stock.component').then((m) => m.PosStockComponent),
    title: 'Movimientos de stock | Admin',
  },
  {
    path: 'proveedores',
    canActivate: [permissionGuard],
    data: { permission: 'SUPPLIERS_MANAGE' },
    loadComponent: () => import('./admin/pos-proveedores/pos-proveedores.component').then((m) => m.PosProveedoresComponent),
    title: 'Proveedores | Admin',
  },
  {
    path: 'gastos',
    canActivate: [permissionGuard],
    data: { permission: 'EXPENSES_MANAGE' },
    loadComponent: () => import('./admin/pos-gastos/pos-gastos.component').then((m) => m.PosGastosComponent),
    title: 'Gastos | Admin',
  },
  {
    path: 'resultados',
    canActivate: [permissionGuard],
    data: { permission: 'FINANCE_VIEW' },
    loadComponent: () => import('./admin/pos-reporte/pos-reporte.component').then((m) => m.PosReporteComponent),
    title: 'Resultados | Admin',
  },
];
