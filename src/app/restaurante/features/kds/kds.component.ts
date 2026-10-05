import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { KdsService } from '../../core/services/kds.service';
import { KdsItem } from '../../core/models/kds.model';

const INTERVALO_POLLING_MS = 5000;

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [],
  templateUrl: './kds.component.html',
})
export class KdsComponent implements OnInit, OnDestroy {
  protected readonly kdsService = inject(KdsService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.kdsService.cargar();
    this.intervalId = setInterval(() => this.kdsService.cargar(), INTERVALO_POLLING_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  avanzar(item: KdsItem): void {
    this.kdsService.avanzarEstado(item.itemId).subscribe(() => this.kdsService.cargar());
  }

  etiquetaAccion(estado: KdsItem['estado']): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Empezar';
      case 'EN_PREPARACION':
        return 'Marcar Listo';
      case 'LISTO':
        return 'Marcar Entregado';
      default:
        return '';
    }
  }

  minutosTranscurridos(fechaCreacion: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(fechaCreacion).getTime()) / 60000));
  }
}
