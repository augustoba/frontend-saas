import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { PosService } from '../../pos.service';
import { Caja, MEDIOS_PAGO, MEDIO_PAGO_LABELS, ResumenCaja, Venta } from '../../pos.models';

/**
 * Caja = turno. Con `:id` muestra una caja (cerrada) del historial; sin `:id`,
 * la abierta: sus números, ingresos/egresos y el cierre con arqueo.
 */
@Component({
  selector: 'app-pos-caja',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './pos-caja.component.html',
})
export class PosCajaComponent {
  private readonly pos = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly medios = MEDIOS_PAGO;
  readonly medioLabels = MEDIO_PAGO_LABELS;
  readonly puedeOperar = () => this.auth.has('SHIFTS_MANAGE');

  /** Caja puntual del historial (ruta /cajas/:id). */
  readonly idHistorial = this.route.snapshot.paramMap.get('id');

  /** undefined = cargando, null = no hay caja abierta. */
  readonly resumen = signal<ResumenCaja | null | undefined>(undefined);
  readonly historial = signal<Caja[]>([]);
  readonly ventas = signal<Venta[]>([]);

  readonly montoInicial = signal<number | null>(null);
  readonly movTipo = signal<'INGRESO' | 'EGRESO'>('EGRESO');
  readonly movMonto = signal<number | null>(null);
  readonly movMotivo = signal('');
  readonly contado = signal<number | null>(null);
  readonly notaCierre = signal('');

  /** Vista previa del arqueo mientras se carga lo contado. */
  readonly diferenciaPrevia = computed(() => {
    const r = this.resumen();
    const c = this.contado();
    return r && c != null ? c - r.efectivoEsperado : null;
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    if (this.idHistorial) {
      this.pos.caja(this.idHistorial).subscribe((r) => this.resumen.set(r));
      this.pos.ventas(this.idHistorial).subscribe((v) => this.ventas.set(v));
      return;
    }
    this.pos.cajaActual().subscribe({ next: (r) => this.resumen.set(r), error: () => this.resumen.set(null) });
    if (this.auth.has('CASH_REGISTER_VIEW')) this.pos.cajas().subscribe((c) => this.historial.set(c));
  }

  abrir(): void {
    this.pos.abrirCaja(this.montoInicial() ?? 0).subscribe((r) => {
      this.toast.success(`Caja #${r.caja.numero} abierta.`);
      this.montoInicial.set(null);
      this.cargar();
    });
  }

  registrarMovimiento(): void {
    const monto = this.movMonto();
    const motivo = this.movMotivo().trim();
    if (!monto || monto <= 0 || !motivo) return;
    this.pos.movimientoCaja(this.movTipo(), monto, motivo).subscribe(() => {
      this.toast.success(this.movTipo() === 'EGRESO' ? 'Egreso registrado.' : 'Ingreso registrado.');
      this.movMonto.set(null);
      this.movMotivo.set('');
      this.cargar();
    });
  }

  async cerrar(): Promise<void> {
    const r = this.resumen();
    const contado = this.contado();
    if (!r || contado == null || contado < 0) return;
    const dif = contado - r.efectivoEsperado;
    const ok = await this.confirm.confirm({
      title: `Cerrar caja #${r.caja.numero}`,
      message:
        dif === 0
          ? 'El efectivo contado coincide con lo esperado. Después de cerrar no se puede vender ni anular en esta caja.'
          : `Hay una diferencia de ${dif.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} ` +
            `(${dif > 0 ? 'sobra' : 'falta'}). Queda registrada en el cierre. ¿Cerrar igual?`,
      confirmLabel: 'Cerrar caja',
      danger: dif !== 0,
    });
    if (!ok) return;
    this.pos.cerrarCaja(contado, this.notaCierre().trim() || null).subscribe((cerrada) => {
      this.toast.success(`Caja #${cerrada.caja.numero} cerrada.`);
      this.contado.set(null);
      this.notaCierre.set('');
      this.cargar();
    });
  }
}
