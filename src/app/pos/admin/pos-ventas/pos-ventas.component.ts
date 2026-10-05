import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PosService } from '../../pos.service';
import { MEDIO_PAGO_LABELS, Venta, etiquetaFactura } from '../../pos.models';

/** Últimas ventas del mostrador (todas las cajas). */
@Component({
  selector: 'app-pos-ventas',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './pos-ventas.component.html',
})
export class PosVentasComponent {
  private readonly pos = inject(PosService);

  readonly medioLabels = MEDIO_PAGO_LABELS;
  readonly etiquetaFactura = etiquetaFactura;
  readonly ventas = signal<Venta[] | null>(null);

  constructor() {
    this.pos.ventas().subscribe({ next: (v) => this.ventas.set(v), error: () => this.ventas.set([]) });
  }
}
