import { Component, effect, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LowStockItem } from '../../../core/models/dashboard.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, SkeletonComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  readonly status = this.dashboardService.status;
  readonly dashboard = this.dashboardService.dashboard;
  readonly lowStockItems = this.dashboardService.lowStock;
  readonly lowStockCount = this.dashboardService.lowStockCount;
  readonly lowStockTotal = this.dashboardService.lowStockTotal;
  readonly reload = () => this.dashboardService.loadDashboard();

  isSeen = (item: LowStockItem): boolean => this.dashboardService.isLowStockSeen(item);
  markSeen = (item: LowStockItem): void => this.dashboardService.markLowStockSeen(item);

  /** "No reponer": saca el producto de la lista de reposición (reversible desde el producto). */
  noRestock(item: LowStockItem): void {
    this.dashboardService.removeProductFromLowStock(item.productId);
    this.productService.setDiscontinued(item.productId, true, () =>
      this.toast.success(`"${item.productName}" ya no aparece en reposición. Lo revertís desde el producto.`)
    );
  }

  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private cargado = false;

  constructor() {
    this.settings.ensureLoaded();
    // El inicio del panel es el del ecommerce: un punto de venta arranca en "Vender"
    // y un restaurante en su propio inicio.
    effect(() => {
      if (this.settings.status() !== 'loaded') return;
      const sistema = this.settings.settings().sistema;
      if (sistema === 'POS' || sistema === 'RESTAURANTE') {
        this.router.navigate([sistema === 'POS' ? '/admin/pos' : '/admin/restaurante'], { replaceUrl: true });
      } else if (!this.cargado) {
        this.cargado = true;
        this.dashboardService.loadDashboard();
      }
    });
  }
}
