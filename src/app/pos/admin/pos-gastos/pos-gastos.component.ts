import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { PosService, hoyIso, primeroDelMesIso } from '../../pos.service';
import { Gasto, Proveedor } from '../../pos.models';

const CATEGORIAS = ['Mercadería', 'Servicios', 'Alquiler', 'Sueldos', 'Impuestos', 'Otros'];

/** Gastos del negocio. "Pagado de la caja" lo descuenta del efectivo de la caja abierta. */
@Component({
  selector: 'app-pos-gastos',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './pos-gastos.component.html',
})
export class PosGastosComponent {
  private readonly pos = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly categorias = CATEGORIAS;
  readonly desde = signal(primeroDelMesIso());
  readonly hasta = signal(hoyIso());
  readonly gastos = signal<Gasto[] | null>(null);
  readonly proveedores = signal<Proveedor[]>([]);

  readonly fecha = signal(hoyIso());
  readonly concepto = signal('');
  readonly categoria = signal('Mercadería');
  readonly monto = signal<number | null>(null);
  readonly proveedorId = signal('');
  readonly deCaja = signal(false);

  readonly total = computed(() => (this.gastos() ?? []).reduce((s, g) => s + g.monto, 0));

  constructor() {
    this.cargar();
    this.pos.proveedores().subscribe((p) => this.proveedores.set(p));
  }

  cargar(): void {
    this.pos.gastos(this.desde(), this.hasta()).subscribe({ next: (g) => this.gastos.set(g), error: () => this.gastos.set([]) });
  }

  nombreProveedor(id: string | null): string {
    return this.proveedores().find((p) => p.id === id)?.nombre ?? '';
  }

  guardar(): void {
    const monto = this.monto();
    if (!this.concepto().trim() || !monto || monto <= 0) return;
    this.pos
      .crearGasto({
        fecha: this.fecha() || null,
        concepto: this.concepto().trim(),
        categoria: this.categoria() || null,
        monto,
        proveedorId: this.proveedorId() || null,
        pagadoDeCaja: this.deCaja(),
      })
      .subscribe(() => {
        this.toast.success(this.deCaja() ? 'Gasto cargado y descontado de la caja.' : 'Gasto cargado.');
        this.concepto.set('');
        this.monto.set(null);
        this.deCaja.set(false);
        this.cargar();
      });
  }

  async borrar(g: Gasto): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Borrar gasto',
      message: g.pagadoDeCaja ? `¿Borrar "${g.concepto}"? También se saca el egreso de la caja.` : `¿Borrar "${g.concepto}"?`,
      confirmLabel: 'Borrar',
      danger: true,
    });
    if (!ok) return;
    this.pos.borrarGasto(g.id).subscribe(() => this.cargar());
  }
}
