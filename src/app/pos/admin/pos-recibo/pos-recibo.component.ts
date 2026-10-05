import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { CldImagePipe } from '../../../shared/pipes/cld-image.pipe';
import { PosService } from '../../pos.service';
import { MEDIO_PAGO_LABELS, Venta, etiquetaFactura } from '../../pos.models';

/** Ticket imprimible de una venta del mostrador, con anular y reintentar factura. */
@Component({
  selector: 'app-pos-recibo',
  imports: [CurrencyPipe, DatePipe, RouterLink, CldImagePipe],
  templateUrl: './pos-recibo.component.html',
  styles: `
    @media print {
      .no-print { display: none !important; }
      .receipt { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
    }
  `,
})
export class PosReciboComponent {
  private readonly pos = inject(PosService);
  private readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly logoSrc = this.settings.logoSrc;
  readonly storeName = () => this.settings.settings().storeName;
  readonly storeAddress = () => this.settings.settings().storeAddress;
  readonly medioLabels = MEDIO_PAGO_LABELS;
  readonly etiquetaFactura = etiquetaFactura;
  readonly puedeAnular = () => this.auth.has('SHIFTS_MANAGE');

  readonly venta = signal<Venta | null>(null);
  readonly noEncontrada = signal(false);
  readonly trabajando = signal(false);

  constructor() {
    this.settings.ensureLoaded();
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pos.venta(id).subscribe({ next: (v) => this.venta.set(v), error: () => this.noEncontrada.set(true) });
  }

  imprimir(): void {
    window.print();
  }

  async anular(v: Venta): Promise<void> {
    const motivo = await this.confirm.prompt({
      title: `Anular ${v.codigo}`,
      message: v.factura?.cae
        ? 'Se repone el stock y se emite la nota de crédito en ARCA. Sólo se puede con la caja de la venta abierta.'
        : 'Se repone el stock. Sólo se puede con la caja de la venta abierta.',
      confirmLabel: 'Anular venta',
      danger: true,
      input: { label: 'Motivo (opcional)', placeholder: 'Ej: se arrepintió, error de carga' },
    });
    if (motivo === null) return;
    this.trabajando.set(true);
    this.pos.anular(v.id, motivo.trim() || null).subscribe({
      next: (a) => {
        this.venta.set(a);
        this.trabajando.set(false);
        this.toast.success(`${a.codigo} anulada.`);
      },
      error: () => this.trabajando.set(false),
    });
  }

  reintentar(v: Venta): void {
    this.trabajando.set(true);
    this.pos.reintentarFactura(v.id).subscribe({
      next: (f) => {
        this.venta.set(f);
        this.trabajando.set(false);
        if (f.factura?.cae) this.toast.success('Factura emitida.');
        else this.toast.error(`ARCA volvió a fallar: ${f.factura?.error ?? 'sin detalle'}`);
      },
      error: () => this.trabajando.set(false),
    });
  }
}
