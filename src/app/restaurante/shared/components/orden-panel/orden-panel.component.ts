import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { OrdenService } from '../../../core/services/orden.service';
import { AdminService } from '../../../core/services/admin.service';
import { Orden } from '../../../core/models/orden.model';
import { Producto } from '../../../core/models/producto.model';
import { ProductoPickerComponent } from '../producto-picker/producto-picker.component';
import { PagoModalComponent } from '../pago-modal/pago-modal.component';

@Component({
  selector: 'app-orden-panel',
  standalone: true,
  imports: [FormsModule, ProductoPickerComponent, PagoModalComponent],
  templateUrl: './orden-panel.component.html',
})
export class OrdenPanelComponent implements OnInit {
  protected readonly ordenService = inject(OrdenService);
  protected readonly adminService = inject(AdminService);

  @Input() titulo = 'Orden';
  @Output() cerrada = new EventEmitter<void>();

  protected readonly mostrarPicker = signal(false);
  protected readonly mostrarPago = signal(false);
  protected readonly mostrarLinkCliente = signal(false);
  protected readonly qrLinkCliente = signal<string | null>(null);
  protected readonly mostrarDescuento = signal(false);
  descuentoMonto: number | null = null;

  ngOnInit(): void {
    if (!this.adminService.preferencias()) {
      this.adminService.cargarPreferencias();
    }
  }

  linkCliente(tokenSesion: string): string {
    return `${location.origin}/mesa/${tokenSesion}`;
  }

  toggleLinkCliente(tokenSesion: string): void {
    this.mostrarLinkCliente.set(!this.mostrarLinkCliente());
    if (this.mostrarLinkCliente() && !this.qrLinkCliente()) {
      QRCode.toDataURL(this.linkCliente(tokenSesion), { margin: 1, width: 180, color: { dark: '#6d0d33' } })
        .then((url) => this.qrLinkCliente.set(url))
        .catch(() => this.qrLinkCliente.set(null));
    }
  }

  copiarLinkCliente(tokenSesion: string): void {
    navigator.clipboard?.writeText(this.linkCliente(tokenSesion));
  }

  agregarProducto(p: Producto): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    this.ordenService.agregarItem(orden.id, p.id, 1, null).subscribe();
  }

  quitarItem(itemId: number): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    this.ordenService.quitarItem(orden.id, itemId).subscribe();
  }

  cambiarCantidad(itemId: number, cantidad: number, notas: string | null): void {
    const orden = this.ordenService.ordenActual();
    if (!orden || cantidad < 1) return;
    this.ordenService.editarItem(orden.id, itemId, cantidad, notas).subscribe();
  }

  abrirDescuento(actual: number): void {
    this.descuentoMonto = actual || null;
    this.mostrarDescuento.set(true);
  }

  aplicarDescuento(): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    this.ordenService.aplicarDescuento(orden.id, this.descuentoMonto ?? 0).subscribe(() => this.mostrarDescuento.set(false));
  }

  confirmarItems(): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    this.ordenService.confirmar(orden.id).subscribe();
  }

  siguientePaso(): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    this.ordenService.siguientePaso(orden.id).subscribe();
  }

  onPagado(): void {
    this.mostrarPago.set(false);
    this.cerrada.emit();
  }

  hayPendientes(orden: Orden): boolean {
    return orden.items.some((i) => i.estado === 'PENDIENTE');
  }

  usaPasos(): boolean {
    return !!this.adminService.preferencias()?.pasosPorDefecto;
  }

  hayPendientesDelPasoActual(orden: Orden): boolean {
    return orden.items.some((i) => i.estado === 'PENDIENTE' && i.paso === orden.pasoActual);
  }

  imprimir(tipo: 'comanda' | 'precuenta'): void {
    const orden = this.ordenService.ordenActual();
    if (!orden) return;
    window.open(`/admin/restaurante/imprimir/${orden.id}/${tipo}`, '_blank');
  }
}
