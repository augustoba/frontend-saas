import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PedidoOnlineService } from '../../core/services/pedido-online.service';
import { MenuOnlineService } from '../../core/services/menu-online.service';
import { Orden } from '../../core/models/orden.model';

const INTERVALO_POLLING_MS = 8000;

@Component({
  selector: 'app-pedidos-online',
  standalone: true,
  imports: [],
  templateUrl: './pedidos-online.component.html',
})
export class PedidosOnlineComponent implements OnInit, OnDestroy {
  protected readonly pedidoOnlineService = inject(PedidoOnlineService);
  private readonly menuOnlineService = inject(MenuOnlineService);
  private readonly sanitizer = inject(DomSanitizer);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly mostrarVistaPrevia = signal(false);
  protected readonly copiado = signal(false);

  get publicUrl(): string {
    const slug = this.menuOnlineService.config()?.slug ?? '';
    return `${location.origin}/carta/${slug}`;
  }

  get previewUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.publicUrl);
  }

  ngOnInit(): void {
    this.menuOnlineService.cargar();
    this.pedidoOnlineService.cargarPendientes();
    this.intervalId = setInterval(() => this.pedidoOnlineService.cargarPendientes(), INTERVALO_POLLING_MS);
  }

  copiarLink(): void {
    navigator.clipboard?.writeText(this.publicUrl);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  aceptar(orden: Orden): void {
    this.pedidoOnlineService.aceptar(orden.id).subscribe(() => this.pedidoOnlineService.cargarPendientes());
  }

  rechazar(orden: Orden): void {
    this.pedidoOnlineService.rechazar(orden.id).subscribe(() => this.pedidoOnlineService.cargarPendientes());
  }
}
