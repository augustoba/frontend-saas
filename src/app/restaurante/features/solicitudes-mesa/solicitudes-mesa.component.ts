import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AutopedidoService } from '../../core/services/autopedido.service';
import { SolicitudPendiente } from '../../core/models/autopedido.model';

const INTERVALO_POLLING_MS = 5000;

@Component({
  selector: 'app-solicitudes-mesa',
  standalone: true,
  imports: [],
  templateUrl: './solicitudes-mesa.component.html',
})
export class SolicitudesMesaComponent implements OnInit, OnDestroy {
  protected readonly autopedidoService = inject(AutopedidoService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.autopedidoService.cargarSolicitudesPendientes();
    this.intervalId = setInterval(() => this.autopedidoService.cargarSolicitudesPendientes(), INTERVALO_POLLING_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  atender(s: SolicitudPendiente): void {
    this.autopedidoService.atenderSolicitud(s.id).subscribe(() => this.autopedidoService.cargarSolicitudesPendientes());
  }

  etiqueta(tipo: SolicitudPendiente['tipo']): string {
    return tipo === 'LLAMAR_MOZO' ? '🔔 Llama al mozo' : '🧾 Pide la cuenta';
  }

  minutosTranscurridos(fecha: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 60000));
  }
}
