import { Injectable, inject } from '@angular/core';
import { ToastService as ToastDelPanel } from '../../../core/services/toast.service';

/** Adaptador: las pantallas del restaurante usan los toasts del panel del SaaS. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toast = inject(ToastDelPanel);

  success(message: string): void {
    this.toast.success(message);
  }

  error(message: string): void {
    this.toast.error(message);
  }

  info(message: string): void {
    this.toast.success(message);
  }
}
