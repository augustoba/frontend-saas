import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PosService } from '../../pos.service';
import { Articulo, Categoria, MEDIOS_PAGO, MEDIO_PAGO_LABELS, MedioPago, ResumenCaja } from '../../pos.models';

/** Renglón del ticket en armado. `articulo` null = importe suelto ("varios"). */
interface Renglon {
  articulo: Articulo | null;
  nombre: string;
  precio: number;
  cantidad: number;
}

/**
 * Mostrador: el lector de códigos escribe en el campo de arriba y da Enter
 * (los lectores USB funcionan como un teclado). El campo vuelve a tomar el
 * foco después de cada acción para poder escanear seguido.
 */
@Component({
  selector: 'app-pos-vender',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './pos-vender.component.html',
})
export class PosVenderComponent {
  private readonly pos = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly scanInput = viewChild<ElementRef<HTMLInputElement>>('scan');

  readonly mediosPago = MEDIOS_PAGO;
  readonly medioLabels = MEDIO_PAGO_LABELS;
  readonly puedeAbrirCaja = () => this.auth.has('SHIFTS_MANAGE');

  /** undefined = cargando. */
  readonly caja = signal<ResumenCaja | null | undefined>(undefined);
  readonly articulos = signal<Articulo[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly busqueda = signal('');
  readonly categoriaSel = signal<string>('');
  readonly ticket = signal<Renglon[]>([]);
  readonly medioPago = signal<MedioPago>('EFECTIVO');
  readonly entregado = signal<number | null>(null);
  readonly referencia = signal('');
  readonly cuit = signal('');
  readonly montoInicial = signal<number | null>(null);
  readonly sueltoNombre = signal('');
  readonly sueltoPrecio = signal<number | null>(null);
  readonly guardando = signal(false);
  /** La última venta cobrada, para imprimir su ticket. */
  readonly ultima = signal<{ id: string; codigo: string } | null>(null);

  readonly total = computed(() => this.ticket().reduce((s, r) => s + r.precio * r.cantidad, 0));
  readonly unidades = computed(() => this.ticket().reduce((s, r) => s + r.cantidad, 0));
  readonly vuelto = computed(() => {
    const e = this.entregado();
    return this.medioPago() === 'EFECTIVO' && e != null ? e - this.total() : null;
  });
  readonly faltaEfectivo = computed(() => (this.vuelto() ?? 0) < 0);
  readonly puedeCobrar = computed(
    () => !!this.caja() && this.ticket().length > 0 && !this.guardando() && !this.faltaEfectivo()
  );

  readonly visibles = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaSel();
    return this.articulos()
      .filter((a) => (!cat || a.categoriaId === cat) && (!q || a.nombre.toLowerCase().includes(q) || a.codigoBarras?.includes(q)))
      .slice(0, 60);
  });

  constructor() {
    this.pos.cajaActual().subscribe({ next: (c) => this.caja.set(c), error: () => this.caja.set(null) });
    this.recargarArticulos();
    this.pos.categorias().subscribe((c) => this.categorias.set(c));
  }

  private recargarArticulos(): void {
    this.pos.articulos().subscribe((a) => this.articulos.set(a));
  }

  enfocar(): void {
    setTimeout(() => this.scanInput()?.nativeElement.focus());
  }

  abrirCaja(): void {
    const monto = this.montoInicial() ?? 0;
    this.pos.abrirCaja(monto).subscribe((c) => {
      this.caja.set(c);
      this.toast.success(`Caja #${c.caja.numero} abierta.`);
      this.enfocar();
    });
  }

  /** Enter en el campo: primero busca el código exacto; si no, agrega el único resultado de la búsqueda. */
  escanear(): void {
    const texto = this.busqueda().trim();
    if (!texto) return;
    const local = this.articulos().find((a) => a.codigoBarras === texto);
    if (local) return this.agregarYLimpiar(local);
    const res = this.visibles();
    if (res.length === 1) return this.agregarYLimpiar(res[0]);
    if (/^\d{6,}$/.test(texto)) {
      this.pos.articuloPorCodigo(texto).subscribe({
        next: (a) => this.agregarYLimpiar(a),
        error: () => this.busqueda.set(''),
      });
    }
  }

  private agregarYLimpiar(a: Articulo): void {
    this.agregar(a);
    this.busqueda.set('');
    this.enfocar();
  }

  agregar(a: Articulo): void {
    const enTicket = this.ticket().reduce((s, r) => s + (r.articulo?.id === a.id ? r.cantidad : 0), 0);
    if (a.stock - enTicket <= 0) this.toast.error(`"${a.nombre}" figura sin stock: se vende igual y el stock queda negativo.`);
    this.ticket.update((t) => {
      const i = t.findIndex((r) => r.articulo?.id === a.id);
      if (i === -1) return [...t, { articulo: a, nombre: a.nombre, precio: a.precio, cantidad: 1 }];
      return t.map((r, j) => (j === i ? { ...r, cantidad: r.cantidad + 1 } : r));
    });
  }

  agregarSuelto(): void {
    const precio = this.sueltoPrecio();
    if (!precio || precio <= 0) return;
    this.ticket.update((t) => [...t, { articulo: null, nombre: this.sueltoNombre().trim() || 'Varios', precio, cantidad: 1 }]);
    this.sueltoNombre.set('');
    this.sueltoPrecio.set(null);
    this.enfocar();
  }

  cambiarCantidad(i: number, cantidad: number): void {
    if (!cantidad || cantidad < 1) return this.quitar(i);
    this.ticket.update((t) => t.map((r, j) => (j === i ? { ...r, cantidad: Math.floor(cantidad) } : r)));
  }

  quitar(i: number): void {
    this.ticket.update((t) => t.filter((_, j) => j !== i));
    this.enfocar();
  }

  vaciar(): void {
    this.ticket.set([]);
    this.entregado.set(null);
    this.referencia.set('');
    this.cuit.set('');
    this.medioPago.set('EFECTIVO');
    this.enfocar();
  }

  cobrar(): void {
    if (!this.puedeCobrar()) return;
    this.guardando.set(true);
    const medio = this.medioPago();
    this.pos
      .vender({
        items: this.ticket().map((r) =>
          r.articulo ? { articuloId: r.articulo.id, cantidad: r.cantidad } : { articuloId: null, cantidad: r.cantidad, nombre: r.nombre, precio: r.precio }
        ),
        medioPago: medio,
        montoEntregado: medio === 'EFECTIVO' ? this.entregado() : null,
        referencia: medio === 'TARJETA' || medio === 'TRANSFERENCIA' ? this.referencia().trim() || null : null,
        cuitComprador: this.cuit().trim() || null,
      })
      .subscribe({
        next: (v) => {
          this.guardando.set(false);
          const vuelto = v.vuelto ? ` · Vuelto ${v.vuelto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}` : '';
          this.toast.success(`Venta ${v.codigo} registrada${vuelto}.`);
          if (v.factura?.error) this.toast.error(`ARCA no la facturó: ${v.factura.error}. Podés reintentar desde la venta.`);
          this.ultima.set({ id: v.id, codigo: v.codigo });
          this.vaciar();
          this.recargarArticulos();
          this.pos.cajaActual().subscribe((c) => this.caja.set(c));
        },
        error: () => this.guardando.set(false),
      });
  }

  verRecibo(id: string): void {
    this.router.navigate(['/admin/pos/recibo', id]);
  }
}
