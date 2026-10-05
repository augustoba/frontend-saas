import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PosService } from '../../pos.service';
import { MOTIVO_STOCK_LABELS, MovimientoStock } from '../../pos.models';

/** Historial de stock del kiosco: ventas, anulaciones, ingresos y ajustes, con el stock que quedó. */
@Component({
  selector: 'app-pos-stock',
  imports: [DatePipe, RouterLink],
  template: `
    <a routerLink="/admin/pos/articulos" class="text-sm font-semibold text-brand-600 hover:underline">← Artículos</a>
    <h1 class="font-display font-extrabold text-2xl text-stone-800 mt-1 mb-5">Movimientos de stock</h1>
    @if (movimientos() === null) {
      <p class="text-stone-400 text-sm">Cargando…</p>
    } @else {
      <div class="bg-white rounded-2xl ring-1 ring-black/5 overflow-x-auto">
        <table class="w-full text-sm min-w-[720px]">
          <thead>
            <tr class="text-left text-stone-500 border-b border-stone-100">
              <th class="p-3 font-semibold">Fecha</th>
              <th class="p-3 font-semibold">Artículo</th>
              <th class="p-3 font-semibold">Motivo</th>
              <th class="p-3 font-semibold text-right">Cantidad</th>
              <th class="p-3 font-semibold text-right">Quedó</th>
              <th class="p-3 font-semibold">Quién</th>
            </tr>
          </thead>
          <tbody>
            @for (m of movimientos(); track m.id) {
              <tr class="border-b border-stone-50 last:border-0">
                <td class="p-3 whitespace-nowrap">{{ m.fecha | date: 'dd/MM HH:mm' }}</td>
                <td class="p-3 font-semibold text-stone-800">{{ m.articuloNombre }}</td>
                <td class="p-3">{{ motivos[m.motivo] }}@if (m.nota) { <span class="text-stone-400"> · {{ m.nota }}</span> }</td>
                <td class="p-3 text-right font-semibold" [class.text-mint-700]="m.cantidad > 0" [class.text-red-600]="m.cantidad < 0">
                  {{ m.cantidad > 0 ? '+' : '' }}{{ m.cantidad }}
                </td>
                <td class="p-3 text-right">{{ m.stockResultante }}</td>
                <td class="p-3 text-stone-500">{{ m.autorNombre ?? '—' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-stone-400">Sin movimientos.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class PosStockComponent {
  private readonly pos = inject(PosService);
  readonly motivos = MOTIVO_STOCK_LABELS;
  readonly movimientos = signal<MovimientoStock[] | null>(null);

  constructor() {
    this.pos.movimientosStock().subscribe({ next: (m) => this.movimientos.set(m), error: () => this.movimientos.set([]) });
  }
}
