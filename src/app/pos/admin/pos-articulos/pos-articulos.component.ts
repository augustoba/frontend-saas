import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { PosService } from '../../pos.service';
import { Articulo, ArticuloInput, Categoria, MotivoStock } from '../../pos.models';

interface Borrador {
  id: string | null;
  nombre: string;
  codigoBarras: string;
  precio: number | null;
  costo: number | null;
  iva: number | null;
  stockInicial: number | null;
  umbralStock: number | null;
  categoriaId: string;
}

const VACIO: Borrador = {
  id: null, nombre: '', codigoBarras: '', precio: null, costo: null, iva: null,
  stockInicial: null, umbralStock: null, categoriaId: '',
};

/** ABM de artículos del kiosco, con su stock y las categorías. */
@Component({
  selector: 'app-pos-articulos',
  imports: [CurrencyPipe, FormsModule, NgClass, RouterLink],
  templateUrl: './pos-articulos.component.html',
})
export class PosArticulosComponent {
  private readonly pos = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  readonly puedeEditar = () => this.auth.has('PRODUCTS_MANAGE');

  readonly articulos = signal<Articulo[] | null>(null);
  readonly categorias = signal<Categoria[]>([]);
  readonly verArchivados = signal(false);
  readonly busqueda = signal('');
  readonly categoriaSel = signal('');
  readonly soloStockBajo = signal(false);

  /** Formulario lateral: null = cerrado. */
  readonly borrador = signal<Borrador | null>(null);
  readonly guardando = signal(false);
  readonly nuevaCategoria = signal('');

  /** Ingreso / ajuste de stock en curso. */
  readonly stockDe = signal<Articulo | null>(null);
  readonly stockMotivo = signal<MotivoStock>('INGRESO');
  readonly stockCantidad = signal<number | null>(null);
  readonly stockCosto = signal<number | null>(null);
  readonly stockNota = signal('');

  readonly visibles = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaSel();
    return (this.articulos() ?? []).filter(
      (a) =>
        (!cat || a.categoriaId === cat) &&
        (!this.soloStockBajo() || a.stockBajo || a.stock <= 0) &&
        (!q || a.nombre.toLowerCase().includes(q) || (a.codigoBarras ?? '').includes(q))
    );
  });

  readonly margen = computed(() => {
    const b = this.borrador();
    if (!b?.precio || !b.costo) return null;
    return Math.round(((b.precio - b.costo) / b.costo) * 100);
  });

  constructor() {
    this.cargar();
    this.cargarCategorias();
  }

  cargar(): void {
    this.articulos.set(null);
    this.pos.articulos(this.verArchivados()).subscribe((a) => this.articulos.set(a));
  }

  private cargarCategorias(): void {
    this.pos.categorias().subscribe((c) => this.categorias.set(c));
  }

  nombreCategoria(id: string | null): string {
    return this.categorias().find((c) => c.id === id)?.nombre ?? '';
  }

  alternarArchivados(): void {
    this.verArchivados.update((v) => !v);
    this.cargar();
  }

  nuevo(): void {
    this.stockDe.set(null);
    this.borrador.set({ ...VACIO, categoriaId: this.categoriaSel() });
  }

  editar(a: Articulo): void {
    this.stockDe.set(null);
    this.borrador.set({
      id: a.id, nombre: a.nombre, codigoBarras: a.codigoBarras ?? '', precio: a.precio, costo: a.costo, iva: a.iva,
      stockInicial: null, umbralStock: a.umbralStock, categoriaId: a.categoriaId ?? '',
    });
  }

  campo<K extends keyof Borrador>(k: K, v: Borrador[K]): void {
    this.borrador.update((b) => (b ? { ...b, [k]: v } : b));
  }

  guardar(): void {
    const b = this.borrador();
    if (!b || !b.nombre.trim() || b.precio == null || b.precio < 0) return;
    const input: ArticuloInput = {
      nombre: b.nombre.trim(),
      codigoBarras: b.codigoBarras.trim() || null,
      precio: b.precio,
      costo: b.costo,
      iva: b.iva,
      stockInicial: b.id ? undefined : b.stockInicial,
      umbralStock: b.umbralStock,
      categoriaId: b.categoriaId || null,
    };
    this.guardando.set(true);
    const req = b.id ? this.pos.actualizarArticulo(b.id, input) : this.pos.crearArticulo(input);
    req.subscribe({
      next: (a) => {
        this.guardando.set(false);
        this.toast.success(b.id ? 'Artículo actualizado.' : `"${a.nombre}" creado.`);
        this.borrador.set(null);
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  async archivar(a: Articulo): Promise<void> {
    if (!a.archivado) {
      const ok = await this.confirm.confirm({
        title: 'Archivar artículo',
        message: `"${a.nombre}" deja de aparecer para vender. Sigue en las ventas viejas y se puede restaurar.`,
        confirmLabel: 'Archivar',
      });
      if (!ok) return;
    }
    this.pos.archivar(a.id, !a.archivado).subscribe(() => {
      this.toast.success(a.archivado ? 'Artículo restaurado.' : 'Artículo archivado.');
      this.cargar();
    });
  }

  abrirStock(a: Articulo, motivo: MotivoStock): void {
    this.borrador.set(null);
    this.stockDe.set(a);
    this.stockMotivo.set(motivo);
    this.stockCantidad.set(motivo === 'AJUSTE' ? a.stock : null);
    this.stockCosto.set(a.costo);
    this.stockNota.set('');
  }

  guardarStock(): void {
    const a = this.stockDe();
    const cantidad = this.stockCantidad();
    if (!a || cantidad == null) return;
    const motivo = this.stockMotivo();
    this.pos
      .cambiarStock(a.id, motivo, cantidad, motivo === 'INGRESO' ? this.stockCosto() : null, this.stockNota().trim() || null)
      .subscribe((act) => {
        this.toast.success(`Stock de "${act.nombre}": ${act.stock}.`);
        this.stockDe.set(null);
        this.cargar();
      });
  }

  agregarCategoria(): void {
    const nombre = this.nuevaCategoria().trim();
    if (!nombre) return;
    this.pos.crearCategoria(nombre).subscribe(() => {
      this.nuevaCategoria.set('');
      this.cargarCategorias();
    });
  }

  async renombrarCategoria(c: Categoria): Promise<void> {
    const nombre = await this.confirm.prompt({
      title: 'Renombrar categoría',
      message: '',
      confirmLabel: 'Guardar',
      input: { label: 'Nombre', initial: c.nombre },
    });
    if (!nombre?.trim()) return;
    this.pos.renombrarCategoria(c.id, nombre.trim()).subscribe(() => this.cargarCategorias());
  }

  async borrarCategoria(c: Categoria): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Borrar categoría', message: `¿Borrar "${c.nombre}"?`, confirmLabel: 'Borrar', danger: true });
    if (!ok) return;
    this.pos.borrarCategoria(c.id).subscribe(() => {
      if (this.categoriaSel() === c.id) this.categoriaSel.set('');
      this.cargarCategorias();
    });
  }
}
