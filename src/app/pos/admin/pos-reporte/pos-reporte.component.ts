import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosService, hoyIso, primeroDelMesIso } from '../../pos.service';
import { MEDIOS_PAGO, MEDIO_PAGO_LABELS, Reporte } from '../../pos.models';

/** Resultado del período: lo vendido, lo que costó, los gastos y lo que queda. */
@Component({
  selector: 'app-pos-reporte',
  imports: [CurrencyPipe, FormsModule, KeyValuePipe],
  template: `
    <h1 class="font-display font-extrabold text-2xl text-stone-800 mb-5">Resultados</h1>
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <input type="date" [ngModel]="desde()" (ngModelChange)="desde.set($event)" aria-label="Desde" class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm" />
      <span class="text-stone-400 text-sm">a</span>
      <input type="date" [ngModel]="hasta()" (ngModelChange)="hasta.set($event)" aria-label="Hasta" class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm" />
      <button type="button" (click)="cargar()" class="text-sm font-semibold text-brand-600 hover:underline">Ver</button>
    </div>

    @if (reporte(); as r) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-4">
          <p class="text-xs text-stone-500">Vendido</p>
          <p class="font-display font-extrabold text-2xl">{{ r.totalVendido | currency: 'ARS' : 'symbol' : '1.0-0' }}</p>
          <p class="text-xs text-stone-400">{{ r.cantidadVentas }} venta(s)</p>
        </div>
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-4">
          <p class="text-xs text-stone-500">Ganancia bruta</p>
          <p class="font-display font-extrabold text-2xl">{{ r.gananciaBruta | currency: 'ARS' : 'symbol' : '1.0-0' }}</p>
          <p class="text-xs text-stone-400">Costo de lo vendido {{ r.costoMercaderia | currency: 'ARS' : 'symbol' : '1.0-0' }}</p>
        </div>
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-4">
          <p class="text-xs text-stone-500">Gastos</p>
          <p class="font-display font-extrabold text-2xl">{{ r.gastos | currency: 'ARS' : 'symbol' : '1.0-0' }}</p>
        </div>
        <div class="rounded-2xl ring-1 p-4" [class.bg-mint-50]="r.resultado >= 0" [class.ring-mint-200]="r.resultado >= 0"
          [class.bg-red-50]="r.resultado < 0" [class.ring-red-200]="r.resultado < 0">
          <p class="text-xs text-stone-500">Resultado</p>
          <p class="font-display font-extrabold text-2xl" [class.text-mint-700]="r.resultado >= 0" [class.text-red-600]="r.resultado < 0">
            {{ r.resultado | currency: 'ARS' : 'symbol' : '1.0-0' }}</p>
        </div>
      </div>
      @if (r.vendidoSinCosto > 0) {
        <p class="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-5">
          {{ r.vendidoSinCosto | currency: 'ARS' : 'symbol' : '1.0-0' }} se vendieron sin costo cargado (importes sueltos o artículos sin costo):
          la ganancia bruta los cuenta enteros como ganancia.
        </p>
      }
      <div class="grid lg:grid-cols-3 gap-5 items-start">
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-5">
          <p class="font-display font-bold text-stone-800 mb-3">Por medio de pago</p>
          @for (m of medios; track m) {
            <div class="flex justify-between text-sm py-1"><span class="text-stone-600">{{ medioLabels[m] }}</span>
              <span class="font-semibold">{{ r.porMedioPago[m] | currency: 'ARS' : 'symbol' : '1.0-0' }}</span></div>
          }
        </div>
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-5">
          <p class="font-display font-bold text-stone-800 mb-3">Gastos por categoría</p>
          @for (g of r.gastosPorCategoria | keyvalue; track g.key) {
            <div class="flex justify-between text-sm py-1"><span class="text-stone-600">{{ g.key }}</span>
              <span class="font-semibold">{{ g.value | currency: 'ARS' : 'symbol' : '1.0-0' }}</span></div>
          } @empty { <p class="text-sm text-stone-400">Sin gastos.</p> }
        </div>
        <div class="bg-white rounded-2xl ring-1 ring-black/5 p-5">
          <p class="font-display font-bold text-stone-800 mb-3">Lo más vendido</p>
          @for (a of r.masVendidos; track $index) {
            <div class="flex justify-between gap-2 text-sm py-1"><span class="text-stone-600 truncate">{{ a.nombre }}</span>
              <span class="font-semibold whitespace-nowrap">{{ a.unidades }} u · {{ a.total | currency: 'ARS' : 'symbol' : '1.0-0' }}</span></div>
          } @empty { <p class="text-sm text-stone-400">Sin ventas.</p> }
        </div>
      </div>
    } @else {
      <p class="text-stone-400 text-sm">Cargando…</p>
    }
  `,
})
export class PosReporteComponent {
  private readonly pos = inject(PosService);
  readonly medios = MEDIOS_PAGO;
  readonly medioLabels = MEDIO_PAGO_LABELS;
  readonly desde = signal(primeroDelMesIso());
  readonly hasta = signal(hoyIso());
  readonly reporte = signal<Reporte | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.reporte.set(null);
    this.pos.reporte(this.desde(), this.hasta()).subscribe((r) => this.reporte.set(r));
  }
}
